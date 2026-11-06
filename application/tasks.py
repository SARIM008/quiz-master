from celery import shared_task
import csv
import os
from datetime import datetime,timedelta
from flask import current_app
from .models import db, User, Score, Quiz, Question, Chapter, Subject
from sqlalchemy import and_
from .mail import send_monthly_report_email
from sqlalchemy import func,select
import requests


# Google Chat Webhook URL (set via environment variable; never commit the real URL)
GOOGLE_CHAT_WEBHOOK_URL = os.environ.get("GOOGLE_CHAT_WEBHOOK_URL")


def send_google_chat_message(message_text):
    """Send message to Google Chat using webhook"""
    if not GOOGLE_CHAT_WEBHOOK_URL:
        current_app.logger.warning("GOOGLE_CHAT_WEBHOOK_URL not set; skipping Google Chat message")
        return False
    try:
        payload = {
            "text": message_text
        }
        
        headers = {
            'Content-Type': 'application/json; charset=UTF-8'
        }
        
        response = requests.post(
            GOOGLE_CHAT_WEBHOOK_URL,
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            current_app.logger.info("Google Chat message sent successfully")
            return True
        else:
            current_app.logger.error(f"Failed to send Google Chat message. Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        current_app.logger.error(f"Error sending Google Chat message: {str(e)}")
        return False


@shared_task(ignore_results=False, name="daily_quiz_reminder")
def daily_quiz_reminder():
    """Send daily reminders to users who haven't attempted available quizzes"""
    try:
       
        active_users = db.session.query(User).filter(
            and_(
                User.active == True,
                User.is_flagged == False,
                User.email != "admin@gmail.com" 
            )
        ).all()
        
        
        available_quizzes = db.session.query(Quiz, Chapter, Subject)\
            .join(Chapter, Quiz.chapter_id == Chapter.id)\
            .join(Subject, Chapter.subject_id == Subject.id)\
            .filter(
                and_(
                    Quiz.is_flagged == False,
                    Subject.is_flagged == False
                )
            ).all()
        
        if not available_quizzes:
            return {
                "status": "success",
                "message": "No available quizzes found",
                "users_notified": 0
            }
        
        users_with_unattempted_quizzes = []
        total_notifications_sent = 0
        failed_notifications = 0
        
        for user in active_users:
           
            attempted_quiz_ids = db.session.query(Score.quiz_id)\
                .filter(Score.user_id == user.id)\
                .distinct()\
                .all()
            
            attempted_quiz_ids = [quiz_id[0] for quiz_id in attempted_quiz_ids]
            
           
            unattempted_quizzes = []
            for quiz, chapter, subject in available_quizzes:
                if quiz.id not in attempted_quiz_ids:
                   
                    question_count = db.session.query(Question)\
                        .filter(Question.quiz_id == quiz.id, Question.is_flagged == False)\
                        .count()
                    
                    if question_count > 0: 
                        unattempted_quizzes.append({
                            'quiz_id': quiz.id,
                            'subject_name': subject.name,
                            'chapter_name': chapter.name,
                            'question_count': question_count,
                            'time_duration': quiz.time_duration or 'Not specified',
                            'remarks': quiz.remarks or 'No remarks'
                        })
            
            # If user has unattempted quizzes, send notification
            if unattempted_quizzes:
                users_with_unattempted_quizzes.append({
                    'user': user,
                    'unattempted_count': len(unattempted_quizzes),
                    'quizzes': unattempted_quizzes[:5]  #  max 5 quizzes in notification
                })
                
                # Send Google Chat notification
                message_sent = send_quiz_reminder_to_google_chat(user, unattempted_quizzes)
                
                if message_sent:
                    total_notifications_sent += 1
                else:
                    failed_notifications += 1
        
       
        log_summary_locally(
            total_users=len(active_users),
            users_with_unattempted=len(users_with_unattempted_quizzes),
            total_available_quizzes=len(available_quizzes),
            notifications_sent=total_notifications_sent,
            failed_notifications=failed_notifications
        )
        
        return {
            "status": "success",
            "message": f"Daily quiz reminders processed successfully",
            "total_active_users": len(active_users),
            "users_with_unattempted_quizzes": len(users_with_unattempted_quizzes),
            "total_available_quizzes": len(available_quizzes),
            "notifications_sent": total_notifications_sent,
            "failed_notifications": failed_notifications,
            "processed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    except Exception as e:
        error_message = f"Error in daily quiz reminder task: {str(e)}"
        current_app.logger.error(error_message)
        
        return {
            "status": "error",
            "message": f"Failed to process daily quiz reminders: {str(e)}"
        }


def send_quiz_reminder_to_google_chat(user, unattempted_quizzes):
    """Send individual quiz reminder to g-Chat"""
    try:
        total_unattempted = len(unattempted_quizzes)
        
       
        quiz_list = []
        for i, quiz in enumerate(unattempted_quizzes[:5], 1):
            quiz_list.append(
                f"   {i}. {quiz['subject_name']} - {quiz['chapter_name']} "
                f"({quiz['question_count']} questions, Duration: {quiz['time_duration']})"
            )
        
        quiz_details = "\n".join(quiz_list)
        
        if total_unattempted > 5:
            quiz_details += f"\n   ... and {total_unattempted - 5} more quizzes"
        
        message = f"""Daily Quiz Reminder

Hello {user.full_name},

You have {total_unattempted} unattempted quiz(s) :

{quiz_details}



User: {user.email}
Reminder sent: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

Good luck"""

        return send_google_chat_message(message)
        
    except Exception as e:
        current_app.logger.error(f"Error sending individual reminder for user {user.id}: {str(e)}")
        return False


def log_summary_locally(total_users, users_with_unattempted, total_available_quizzes, notifications_sent, failed_notifications):
    """Log daily summary locally instead of sending to Google Chat"""
    try:
        success_rate = (notifications_sent / (notifications_sent + failed_notifications) * 100) if (notifications_sent + failed_notifications) > 0 else 0
        
        summary_message = f"""Daily Quiz Reminder Summary - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        
User Statistics:
- Total Active Users: {total_users}
- Users with Unattempted Quizzes: {users_with_unattempted}
- Users who need no reminders: {total_users - users_with_unattempted}

Quiz Statistics:
- Total Available Quizzes: {total_available_quizzes}

Notification Results:
- Successful Notifications: {notifications_sent}
- Failed Notifications: {failed_notifications}
- Success Rate: {success_rate:.1f}%

Status: {"All reminders sent successfully" if failed_notifications == 0 else "Some notifications failed - check logs"}"""

        current_app.logger.info(summary_message)
        return True
        
    except Exception as e:
        current_app.logger.error(f"Error logging summary: {str(e)}")
        return False



@shared_task(ignore_results=False, name="download_csv_report")
def csv_report():
    """Generate comprehensive admin CSV report with all user quiz performance data"""
    try:
       
        static_folder = os.path.join(current_app.root_path, 'static')
        
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"admin_quiz_report_{timestamp}.csv"
        filepath = os.path.join(static_folder, filename)
        
        
        query_results = db.session.query(
            User.id.label('user_id'),
            User.full_name.label('user_name'),
            User.email.label('user_email'),
            User.qualification.label('user_qualification'),
            User.dob.label('user_dob'),
            User.is_flagged.label('user_is_flagged'),
            Score.id.label('score_id'),
            Score.total_scored.label('score_achieved'),
            Score.time_stamp_of_attempt.label('attempt_timestamp'),
            Quiz.id.label('quiz_id'),
            Quiz.time_duration.label('quiz_duration'),
            Quiz.remarks.label('quiz_remarks'),
            Quiz.date_of_quiz.label('quiz_created_date'),
            Chapter.id.label('chapter_id'),
            Chapter.name.label('chapter_name'),
            Subject.id.label('subject_id'),
            Subject.name.label('subject_name')
        ).join(Score, User.id == Score.user_id)\
         .join(Quiz, Score.quiz_id == Quiz.id)\
         .join(Chapter, Quiz.chapter_id == Chapter.id)\
         .join(Subject, Chapter.subject_id == Subject.id)\
         .order_by(User.id, Score.time_stamp_of_attempt.desc()).all()
        
        # Write CSV file
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'user_id', 'user_name', 'user_email', 'user_qualification', 'user_dob', 'user_is_flagged',
                'total_quiz_attempts', 'average_score_percentage', 'best_score_percentage', 'latest_attempt_date',
                'subject_id', 'subject_name', 'chapter_id', 'chapter_name', 
                'quiz_id', 'quiz_duration', 'quiz_remarks', 'quiz_created_date',
                'score_achieved', 'total_questions', 'score_percentage', 'attempt_timestamp',
                'user_rank_by_avg_score', 'user_performance_category'
            ]
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
           
            user_data = {}
            for row in query_results:
                user_id = row.user_id
                
                
                question_count = db.session.query(Question).filter_by(quiz_id=row.quiz_id).count()
                score_percentage = round((row.score_achieved / question_count * 100), 2) if question_count > 0 else 0
                
               
                if user_id not in user_data:
                    user_data[user_id] = {
                        'user_info': {
                            'user_id': row.user_id,
                            'user_name': row.user_name,
                            'user_email': row.user_email,
                            'user_qualification': row.user_qualification,
                            'user_dob': row.user_dob.strftime("%Y-%m-%d"),
                            'user_is_flagged': row.user_is_flagged
                        },
                        'attempts': [],
                        'scores': [],
                        'latest_attempt': None
                    }
                
                
                attempt_data = {
                    'subject_id': row.subject_id,
                    'subject_name': row.subject_name,
                    'chapter_id': row.chapter_id,
                    'chapter_name': row.chapter_name,
                    'quiz_id': row.quiz_id,
                    'quiz_duration': row.quiz_duration,
                    'quiz_remarks': row.quiz_remarks,
                    'quiz_created_date': row.quiz_created_date.strftime("%Y-%m-%d %H:%M:%S"),
                    'score_achieved': row.score_achieved,
                    'total_questions': question_count,
                    'score_percentage': score_percentage,
                    'attempt_timestamp': row.attempt_timestamp.strftime("%Y-%m-%d %H:%M:%S")
                }
                
                user_data[user_id]['attempts'].append(attempt_data)
                user_data[user_id]['scores'].append(score_percentage)
                
                
                if (user_data[user_id]['latest_attempt'] is None or 
                    row.attempt_timestamp > datetime.strptime(user_data[user_id]['latest_attempt'], "%Y-%m-%d %H:%M:%S")):
                    user_data[user_id]['latest_attempt'] = row.attempt_timestamp.strftime("%Y-%m-%d %H:%M:%S")
            
            
            user_averages = []
            for user_id, data in user_data.items():
                if data['scores']:
                    avg_score = sum(data['scores']) / len(data['scores'])
                    user_averages.append((user_id, avg_score))
            
            
            user_averages.sort(key=lambda x: x[1], reverse=True)
            user_rankings = {user_id: rank + 1 for rank, (user_id, _) in enumerate(user_averages)}
            
           
            for user_id, data in user_data.items():
                user_info = data['user_info']
                attempts = data['attempts']
                scores = data['scores']
                
               
                total_attempts = len(attempts)
                avg_score = round(sum(scores) / len(scores), 2) if scores else 0
                best_score = round(max(scores), 2) if scores else 0
                latest_attempt = data['latest_attempt']
                user_rank = user_rankings.get(user_id, 0)
                
               
                if avg_score >= 80:
                    performance_category = "Excellent"
                elif avg_score >= 60:
                    performance_category = "Good"
                elif avg_score >= 40:
                    performance_category = "Average"
                else:
                    performance_category = "Needs Improvement"
                
               
                for attempt in attempts:
                    writer.writerow({
                        **user_info,
                        'total_quiz_attempts': total_attempts,
                        'average_score_percentage': avg_score,
                        'best_score_percentage': best_score,
                        'latest_attempt_date': latest_attempt,
                        'user_rank_by_avg_score': user_rank,
                        'user_performance_category': performance_category,
                        **attempt
                    })
        
        
        total_users = len(user_data)
        total_attempts = sum(len(data['attempts']) for data in user_data.values())
        active_users = len([uid for uid, data in user_data.items() if not data['user_info']['user_is_flagged']])
        
        return {
            "status": "success",
            "message": "CSV report generated successfully",
            "filename": filename,
            "filepath": filepath,
            "summary": {
                "total_users_with_attempts": total_users,
                "total_quiz_attempts": total_attempts,
                "active_users": active_users,
                "flagged_users": total_users - active_users,
                "report_generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to generate CSV report: {str(e)}"
        }


@shared_task(ignore_results=False, name="download_user_quiz_history_csv")  
def user_quiz_history_csv(user_id):
    """ CSV report for user's quiz history (for user dashboard)"""
    try:
        
        static_folder = os.path.join(current_app.root_path, 'static')
        
        
       
        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"user_{user_id}_quiz_history_{timestamp}.csv"
        filepath = os.path.join(static_folder, filename)
        
        
        user_attempts = db.session.query(
            Score.id.label('attempt_id'),
            Score.total_scored.label('score_achieved'),
            Score.time_stamp_of_attempt.label('attempt_date'),
            Quiz.id.label('quiz_id'),
            Quiz.time_duration.label('quiz_duration'),
            Quiz.remarks.label('quiz_remarks'),
            Chapter.id.label('chapter_id'),
            Chapter.name.label('chapter_name'),
            Subject.id.label('subject_id'),
            Subject.name.label('subject_name')
        ).join(Quiz, Score.quiz_id == Quiz.id)\
         .join(Chapter, Quiz.chapter_id == Chapter.id)\
         .join(Subject, Chapter.subject_id == Subject.id)\
         .filter(Score.user_id == user_id)\
         .order_by(Score.time_stamp_of_attempt.desc()).all()
        
        # Write CSV
        with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = [
                'attempt_id', 'subject_name', 'chapter_name', 'quiz_id', 
                'quiz_duration', 'quiz_remarks', 'score_achieved', 'total_questions',
                'score_percentage', 'attempt_date', 'attempt_rank'
            ]
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            
            attempts_with_percentage = []
            for i, attempt in enumerate(user_attempts):
                question_count = db.session.query(Question).filter_by(quiz_id=attempt.quiz_id).count()
                score_percentage = round((attempt.score_achieved / question_count * 100), 2) if question_count > 0 else 0
                
                attempts_with_percentage.append({
                    'attempt_id': attempt.attempt_id,
                    'subject_name': attempt.subject_name,
                    'chapter_name': attempt.chapter_name,
                    'quiz_id': attempt.quiz_id,
                    'quiz_duration': attempt.quiz_duration,
                    'quiz_remarks': attempt.quiz_remarks or 'No remarks',
                    'score_achieved': attempt.score_achieved,
                    'total_questions': question_count,
                    'score_percentage': score_percentage,
                    'attempt_date': attempt.attempt_date.strftime("%Y-%m-%d %H:%M:%S"),
                    'attempt_rank': i + 1  
                })
            
            for attempt_data in attempts_with_percentage:
                writer.writerow(attempt_data)
        
        return {
            "status": "success",
            "message": f"Quiz history CSV generated for {user.full_name}",
            "filename": filename,
            "filepath": filepath,
            "user_name": user.full_name,
            "total_attempts": len(attempts_with_percentage)
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to generate user CSV: {str(e)}"
        }


@shared_task(ignore_results=False, name="monthly_report")
def monthly_report():
    """Generate and send monthly activity reports to all active users"""
    try:
      
        today = datetime.now()
        first_day_current_month = today.replace(day=1)
        last_day_previous_month = first_day_current_month - timedelta(days=1)
        first_day_previous_month = last_day_previous_month.replace(day=1)
        
        month_year = last_day_previous_month.strftime("%B %Y")
        
        users_with_activity = db.session.query(User.id).join(Score)\
    .filter(
        and_(
            User.active == True,
            User.is_flagged == False
        )
    ).distinct().all()
        
        successful_emails = 0
        failed_emails = 0
        
        for user_tuple in users_with_activity:
            user_id = user_tuple[0]
            
            try:
                
                user_report = generate_user_monthly_report(user_id, first_day_previous_month, last_day_previous_month, month_year)
                
                if user_report['status'] == 'success':
                   
                    email_sent = send_monthly_report_email(
                        user_email=user_report['user_email'],
                        user_name=user_report['user_name'],
                        report_data=user_report['report_data']
                    )
                    
                    if email_sent:
                        successful_emails += 1
                    else:
                        failed_emails += 1
                else:
                    failed_emails += 1
                    
            except Exception as e:
                current_app.logger.error(f"Failed to process monthly report for user {user_id}: {str(e)}")
                failed_emails += 1
        
        return {
            "status": "success",
            "message": f"Monthly reports processed. Sent: {successful_emails}, Failed: {failed_emails}",
            "month_year": month_year,
            "total_users_processed": len(users_with_activity),
            "successful_emails": successful_emails,
            "failed_emails": failed_emails,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to generate monthly reports: {str(e)}"
        }


def generate_user_monthly_report(user_id, start_date, end_date, month_year):
    """Generate monthly report data for a specific user"""
    try:
       
        user = db.session.query(User).filter_by(id=user_id).first()
        if not user:
            return {"status": "error", "message": "User not found"}
        
        
        monthly_attempts = db.session.query(
            Score.id.label('attempt_id'),
            Score.total_scored.label('score_achieved'),
            Score.time_stamp_of_attempt.label('attempt_date'),
            Quiz.id.label('quiz_id'),
            Quiz.time_duration.label('quiz_duration'),
            Quiz.remarks.label('quiz_remarks'),
            Chapter.id.label('chapter_id'),
            Chapter.name.label('chapter_name'),
            Subject.id.label('subject_id'),
            Subject.name.label('subject_name')
        ).join(Quiz, Score.quiz_id == Quiz.id)\
         .join(Chapter, Quiz.chapter_id == Chapter.id)\
         .join(Subject, Chapter.subject_id == Subject.id)\
         .filter(Score.user_id == user_id)\
         .order_by(Score.time_stamp_of_attempt.desc()).all()
        
        if not monthly_attempts:
            return {"status": "error", "message": "No quiz attempts found for this month"}
        
       
        quiz_attempts = []
        scores = []
        total_time_minutes = 0
        
        for attempt in monthly_attempts:
            
            question_count = db.session.query(Question).filter_by(quiz_id=attempt.quiz_id).count()
            score_percentage = round((attempt.score_achieved / question_count * 100), 2) if question_count > 0 else 0
            scores.append(score_percentage)
            
           
            if attempt.quiz_duration:
                try:
                    time_parts = attempt.quiz_duration.split(':')
                    if len(time_parts) == 2:
                        hours, minutes = map(int, time_parts)
                        total_time_minutes += (hours * 60) + minutes
                except:
                    pass  
            
            quiz_attempts.append({
                'attempt_id': attempt.attempt_id,
                'subject_name': attempt.subject_name,
                'chapter_name': attempt.chapter_name,
                'quiz_id': attempt.quiz_id,
                'quiz_duration': attempt.quiz_duration or '00:00',
                'quiz_remarks': attempt.quiz_remarks or '',
                'score_achieved': attempt.score_achieved,
                'total_questions': question_count,
                'score_percentage': score_percentage,
                'attempt_date': attempt.attempt_date.strftime("%Y-%m-%d %H:%M:%S")
            })
        
       
        total_quizzes = len(quiz_attempts)
        average_score = round(sum(scores) / len(scores), 2) if scores else 0
        best_score = round(max(scores), 2) if scores else 0
        
       
        if average_score >= 80:
            performance_category = "Excellent"
        elif average_score >= 60:
            performance_category = "Good"
        elif average_score >= 40:
            performance_category = "Average"
        else:
            performance_category = "Needs Improvement"
        
        
        global_rank = calculate_user_global_rank(user_id, start_date, end_date)
        
        
        improvement_areas = identify_improvement_areas(quiz_attempts, average_score)
        
        
        report_data = {
            'month_year': month_year,
            'total_quizzes': total_quizzes,
            'average_score': average_score,
            'best_score': best_score,
            'total_time_spent': total_time_minutes,
            'performance_category': performance_category,
            'global_rank': global_rank,
            'quiz_attempts': quiz_attempts,
            'improvement_areas': improvement_areas,
            'generated_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return {
            "status": "success",
            "user_email": user.email,
            "user_name": user.full_name,
            "report_data": report_data
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to generate user report: {str(e)}"
        }


def calculate_user_global_rank(user_id, start_date, end_date):
   
    try:
        
        user_averages = db.session.query(
            Score.user_id,
            func.avg(
                (Score.total_scored.cast(db.Float) /
                 db.session.query(func.count(Question.id))
                 .filter(Question.quiz_id == Score.quiz_id)
                 .scalar_subquery().cast(db.Float)) * 100
            ).label('avg_score')
        ).filter(
            and_(
                Score.time_stamp_of_attempt >= start_date,
                Score.time_stamp_of_attempt <= end_date
            )
        ).group_by(Score.user_id).subquery()

     
        stmt = select(
            user_averages.c.user_id,
            user_averages.c.avg_score,
            func.rank().over(order_by=user_averages.c.avg_score.desc()).label('rank')
        ).select_from(user_averages)

        rankings = db.session.execute(stmt).fetchall()

        for ranking in rankings:
            if ranking.user_id == user_id:
                return ranking.rank

        return None

    except Exception as e:
        current_app.logger.error(f"Failed to calculate global rank: {str(e)}")
        return None


def identify_improvement_areas(quiz_attempts, average_score):
    
    improvement_areas = []
    
    if not quiz_attempts:
        return improvement_areas
    
    
    subject_scores = {}
    for attempt in quiz_attempts:
        subject = attempt['subject_name']
        if subject not in subject_scores:
            subject_scores[subject] = []
        subject_scores[subject].append(attempt['score_percentage'])
    
   
    weak_subjects = []
    for subject, scores in subject_scores.items():
        avg_subject_score = sum(scores) / len(scores)
        if avg_subject_score < 50:
            weak_subjects.append(subject)
    
    if weak_subjects:
        improvement_areas.append(f"Focus more on: {', '.join(weak_subjects[:3])}")
    
   
    if average_score < 40:
        improvement_areas.append("Review fundamental concepts before attempting quizzes")
        improvement_areas.append("Take more practice quizzes to improve your scores")
    elif average_score < 60:
        improvement_areas.append("Work on time management during quizzes")
        improvement_areas.append("Review incorrect answers to learn from mistakes")
    elif average_score < 80:
        improvement_areas.append("Focus on advanced topics to reach excellence")
    
    
    if quiz_attempts:
        scores = [attempt['score_percentage'] for attempt in quiz_attempts]
        if len(scores) > 1:
            score_variance = max(scores) - min(scores)
            if score_variance > 40:
                improvement_areas.append("Work on consistency - your scores vary significantly")
    
    return improvement_areas[:4]  


def send_daily_reminder_email(user_email, user_name):
    """Send daily reminder email to user"""
    from .mail import send_email
    
    subject = "Don't forget your daily quiz practice"
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Quiz Time</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Hey {user_name}, ready for today's learning challenge?</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Why daily practice matters:</h3>
            <ul style="color: #666; line-height: 1.6;">
                <li>Reinforces your learning and improves retention</li>
                <li>Builds confidence for important exams</li>
                <li>Helps you track your progress over time</li>
                <li>Keeps you ahead in your studies</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                Start Quiz Now
            </a>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px;">
            <p>Keep up the great work!</p>
            <p style="font-size: 12px;">This is an automated reminder. You can unsubscribe anytime.</p>
        </div>
    </div>
    """
    
    text_body = f"""
    Hi {user_name},
    
    A reminder to take your daily quiz practice
    
   
    
    Start your quiz today 
    
    Best regards,
    Quiz App 
    """
    
    return send_email(
        subject=subject,
        recipients=[user_email],
        html_body=html_body,
        text_body=text_body
    )