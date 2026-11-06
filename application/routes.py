from flask import Blueprint,jsonify,request,current_app,render_template,send_file
from flask_security import auth_required, roles_required ,current_user,login_user
from flask_security.utils import hash_password
from werkzeug.security import check_password_hash, generate_password_hash
from .database import db
from datetime import datetime
from .resources import *
from flask import Blueprint, request, jsonify, current_app
from flask_security import login_user
from flask_security.utils import verify_password
from celery.result import AsyncResult
from .tasks import csv_report,monthly_report
import os


routes_bp = Blueprint("routes", __name__)





@routes_bp.route('/', methods = ['GET'])
def home():
    return render_template('index.html')


@routes_bp.route('/api/login', methods=['POST'])
def user_login():
    credentials = request.get_json()
    
    if not credentials or "email" not in credentials or "password" not in credentials:
        return jsonify({"error": "Email and password are required"}), 400
    
    email = credentials["email"]
    password = credentials["password"]
    
    datastore = current_app.security.datastore
    user = datastore.find_user(email=email)
    
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.active:
        return jsonify({"error": "User account is inactive"}), 403
    
    # Check if user is flagged
    if user.is_flagged:
        return jsonify({"error": "User account is flagged and cannot login"}), 403
    
    if not user.check_password(password):
        return jsonify({"error": "Incorrect password"}), 400
    
    login_user(user)
    
    token = user.get_auth_token()
    
    return jsonify({
        "message": "Login successful",
        "id": user.id,
        "username": user.full_name,
        "email": user.email,
        "qualification": user.qualification,
        "dob": user.dob.strftime("%Y-%m-%d"),
        "roles": [role.name for role in user.roles],
        "auth-token": token
    }), 200




from flask import request, jsonify
from flask_security import auth_required, roles_required
import logging

@routes_bp.route('/api/admindashboard')
@roles_required('admin')
def admin_home():
    
    auth_header = request.headers.get("Authentication-Token")
    logging.info(f"Received Token: {auth_header}")  

    if not auth_header:
        return jsonify({"error": "Missing authentication token"}), 401

    
    subjects = Subject.query.all()
    data = []

    for subject in subjects:
        chapters_data = []
        for chapter in subject.chapters:
           
            total_questions = sum(len(quiz.questions) for quiz in chapter.quizzes)

            chapter_info = {
                "id": chapter.id,
                "name": chapter.name,
                "question_count": total_questions  
            }
            chapters_data.append(chapter_info)

        data.append({
            "subject_id": subject.id,
            "subject_name": subject.name,
            "chapters": chapters_data,
            "is_flagged": subject.is_flagged
        })

    return jsonify({
        "message": "Admin logged in successfully",
        "subjects": data
    }), 200

@routes_bp.route('/api/admin/quiz_data', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_admin_quiz_data():
    
    try:
        
        quizzes = db.session.query(Quiz).join(Chapter).join(Subject).all()
        quiz_data = []

        for quiz in quizzes:
            questions = Question.query.filter_by(quiz_id=quiz.id).all()
            question_list = []

            for question in questions:
                question_data = {
                    "id": question.id,
                    "question_statement": question.question_statement,
                    "option1": question.option1,
                    "option2": question.option2,
                    "option3": question.option3,
                    "option4": question.option4,
                    "correct_option": question.correct_option,
                    "is_flagged": question.is_flagged
                }
                question_list.append(question_data)

            quiz_info = {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "chapter_name": quiz.chapter.name,  
                "subject_name": quiz.chapter.subject.name, 
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks,
                "is_flagged": quiz.is_flagged,
                "questions": question_list
            }
            quiz_data.append(quiz_info)

        return jsonify(quiz_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/chapters', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_chapters():
    
    try:
        chapters = db.session.query(Chapter).join(Subject).all()
        chapter_data = []

        for chapter in chapters:
            chapter_info = {
                "id": chapter.id,
                "name": chapter.name,
                "subject_id": chapter.subject_id,
                "subject_name": chapter.subject.name,
                "description": chapter.description
            }
            chapter_data.append(chapter_info)

        return jsonify(chapter_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500







@routes_bp.route('/api/register', methods=['POST'])
def create_user():
    credentials = request.get_json()


    required_fields = ["email", "password", "full_name", "qualification", "dob"]
    missing_fields = [field for field in required_fields if field not in credentials]

    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

    datastore = current_app.security.datastore

  
    if datastore.find_user(email=credentials["email"]):
        return jsonify({"error": "User already exists!"}), 400

    
    try:
        dob = datetime.strptime(credentials["dob"], "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    
    user_role = datastore.find_role("user")
    if not user_role:
        return jsonify({"error": "User role not found"}), 500

    
    hashed_password = bcrypt.generate_password_hash(credentials["password"]).decode("utf-8")

   
    new_user = datastore.create_user(
        email=credentials["email"],
        password=hashed_password,  
        full_name=credentials["full_name"],
        qualification=credentials["qualification"],
        dob=dob,
        roles=[user_role]
    )

    db.session.commit()

    return jsonify({
        "message": "User created successfully",
        "id": new_user.id,
        "email": new_user.email,
        "username": new_user.full_name
    }), 201



@routes_bp.route('/api/start_quiz/<int:quiz_id>', methods=['GET'])
@auth_required('token')
@roles_required('user')
def start_quiz_route(quiz_id):
    return start_quiz(quiz_id)  

@routes_bp.route('/api/submit_quiz', methods=['POST'])
@auth_required('token')
@roles_required('user')
def submit_quiz_route():
    data = request.get_json()
    return submit_quiz(data) 

@routes_bp.route('/api/scores', methods=['GET'])
@auth_required('token')
@roles_required('user')
def view_scores_route():
    return view_scores() 

@routes_bp.route('/api/user/available_quizzes', methods=['GET'])
@auth_required('token')
@roles_required('user')
def get_available_quizzes():
    """Get all available quizzes for users with subject/chapter info"""
    try:
       
        quizzes_data = db.session.query(Quiz, Chapter, Subject)\
            .join(Chapter, Quiz.chapter_id == Chapter.id)\
            .join(Subject, Chapter.subject_id == Subject.id)\
            .filter(Quiz.is_flagged == False)\
            .filter(Subject.is_flagged == False)\
            .all()
        
        quiz_list = []
        for quiz, chapter, subject in quizzes_data:
           
            question_count = Question.query.filter_by(quiz_id=quiz.id, is_flagged=False).count()
            
            
            user_attempts = Score.query.filter_by(quiz_id=quiz.id, user_id=current_user.id).count()
            user_best_score = db.session.query(db.func.max(Score.total_scored))\
                .filter(Score.quiz_id == quiz.id, Score.user_id == current_user.id).scalar() or 0
            
            quiz_info = {
                "quiz_id": quiz.id,
                "subject_name": subject.name,
                "chapter_name": chapter.name,
                "time_duration": quiz.time_duration,
                "question_count": question_count,
                "remarks": quiz.remarks,
                "user_attempts": user_attempts,
                "user_best_score": user_best_score,
                "date_created": quiz.date_of_quiz.strftime("%Y-%m-%d")
            }
            quiz_list.append(quiz_info)
        
        return jsonify({
            "message": "Available quizzes retrieved successfully",
            "quizzes": quiz_list
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/quiz/<int:quiz_id>/details', methods=['GET'])
@auth_required('token')
def get_quiz_details(quiz_id):
   
    try:
        
        quiz_data = db.session.query(Quiz, Chapter, Subject)\
            .join(Chapter, Quiz.chapter_id == Chapter.id)\
            .join(Subject, Chapter.subject_id == Subject.id)\
            .filter(Quiz.id == quiz_id).first()
        
        if not quiz_data:
            return jsonify({"error": "Quiz not found"}), 404
            
        quiz, chapter, subject = quiz_data
        
       
        question_count = Question.query.filter_by(quiz_id=quiz_id, is_flagged=False).count()
        
       
        highest_score = db.session.query(db.func.max(Score.total_scored))\
            .filter(Score.quiz_id == quiz_id).scalar() or 0
            
    
        user_scores = Score.query.filter_by(quiz_id=quiz_id, user_id=current_user.id)\
            .order_by(Score.time_stamp_of_attempt.desc()).all()
        
        user_attempts = []
        for score in user_scores:
            user_attempts.append({
                "score": score.total_scored,
                "total_questions": question_count,
                "percentage": round((score.total_scored / question_count * 100), 2) if question_count > 0 else 0,
                "attempt_date": score.time_stamp_of_attempt.strftime("%Y-%m-%d %H:%M")
            })
        
        quiz_details = {
            "quiz_id": quiz.id,
            "subject_name": subject.name,
            "chapter_name": chapter.name,
            "time_duration": quiz.time_duration,
            "question_count": question_count,
            "remarks": quiz.remarks,
            "highest_score_overall": highest_score,
            "user_attempts": user_attempts,
            "user_best_score": max([attempt["score"] for attempt in user_attempts]) if user_attempts else 0,
            "date_created": quiz.date_of_quiz.strftime("%Y-%m-%d")
        }
        
        return jsonify({
            "message": "Quiz details retrieved successfully",
            "quiz": quiz_details
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/user/statistics', methods=['GET'])
@auth_required('token')
@roles_required('user')
def get_user_statistics():
    """Get comprehensive statistics for the current user"""
    try:
        user_id = current_user.id
        
        
        user_scores = Score.query.filter_by(user_id=user_id).all()
        
        if not user_scores:
            return jsonify({
                "message": "No quiz attempts found",
                "statistics": {
                    "total_attempts": 0,
                    "average_score": 0,
                    "total_score": 0,
                    "subject_wise_performance": [],
                    "monthly_activity": [],
                    "recent_attempts": []
                }
            }), 200
        
    
        total_questions_attempted = 0
        for score in user_scores:
            quiz = Quiz.query.get(score.quiz_id)
            question_count = Question.query.filter_by(quiz_id=quiz.id).count()
            total_questions_attempted += question_count
        
       
        total_attempts = len(user_scores)
        total_score = sum(score.total_scored for score in user_scores)
        
       
        if total_questions_attempted > 0:
            average_score = round((total_score / total_questions_attempted) * 100, 2)
        else:
            average_score = 0
        
       
        subject_performance = {}
        for score in user_scores:
            quiz = Quiz.query.get(score.quiz_id)
            chapter = Chapter.query.get(quiz.chapter_id)
            subject = Subject.query.get(chapter.subject_id)
            question_count = Question.query.filter_by(quiz_id=quiz.id).count()
            
            if subject.name not in subject_performance:
                subject_performance[subject.name] = {
                    "total_attempts": 0,
                    "total_score": 0,
                    "total_questions": 0,
                    "quizzes_attempted": set()
                }
            
            subject_performance[subject.name]["total_attempts"] += 1
            subject_performance[subject.name]["total_score"] += score.total_scored
            subject_performance[subject.name]["total_questions"] += question_count
            subject_performance[subject.name]["quizzes_attempted"].add(quiz.id)
        
        
        subject_wise_data = []
        for subject_name, data in subject_performance.items():
            if data["total_questions"] > 0:
                avg_percentage = round((data["total_score"] / data["total_questions"]) * 100, 2)
            else:
                avg_percentage = 0
                
            subject_wise_data.append({
                "subject": subject_name,
                "attempts": data["total_attempts"],
                "average_score": avg_percentage,
                "unique_quizzes": len(data["quizzes_attempted"])
            })
        
       
        monthly_activity = {}
        for score in user_scores:
            quiz = Quiz.query.get(score.quiz_id)
            question_count = Question.query.filter_by(quiz_id=quiz.id).count()
            month_key = score.time_stamp_of_attempt.strftime("%Y-%m")
            
            if month_key not in monthly_activity:
                monthly_activity[month_key] = {
                    "attempts": 0,
                    "total_score": 0,
                    "total_questions": 0
                }
            monthly_activity[month_key]["attempts"] += 1
            monthly_activity[month_key]["total_score"] += score.total_scored
            monthly_activity[month_key]["total_questions"] += question_count
        
        monthly_data = []
        for month, data in sorted(monthly_activity.items()):
            if data["total_questions"] > 0:
                avg_percentage = round((data["total_score"] / data["total_questions"]) * 100, 2)
            else:
                avg_percentage = 0
                
            monthly_data.append({
                "month": month,
                "attempts": data["attempts"],
                "average_score": avg_percentage
            })
        
       
        recent_scores = sorted(user_scores, key=lambda x: x.time_stamp_of_attempt, reverse=True)[:5]
        recent_attempts = []
        
        for score in recent_scores:
            quiz = Quiz.query.get(score.quiz_id)
            chapter = Chapter.query.get(quiz.chapter_id)
            subject = Subject.query.get(chapter.subject_id)
            question_count = Question.query.filter_by(quiz_id=quiz.id).count()
            
            recent_attempts.append({
                "quiz_id": quiz.id,
                "subject": subject.name,
                "chapter": chapter.name,
                "score": score.total_scored,
                "total_questions": question_count,
                "percentage": round((score.total_scored / question_count * 100), 2) if question_count > 0 else 0,
                "attempt_date": score.time_stamp_of_attempt.strftime("%Y-%m-%d %H:%M")
            })
        
        return jsonify({
            "message": "User statistics retrieved successfully",
            "statistics": {
                "total_attempts": total_attempts,
                "average_score": average_score, 
                "total_score": total_score,
                "subject_wise_performance": subject_wise_data,
                "monthly_activity": monthly_data[-6:], 
                "recent_attempts": recent_attempts
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/search_quizzes', methods=['GET'])
@auth_required('token')
def search_quizzes():
    """Search quizzes by subject, chapter, or remarks"""
    try:
        query = request.args.get('query', '').strip()
        
        if not query:
            return jsonify({"error": "Search query is required"}), 400
        
      
        search_results = db.session.query(Quiz, Chapter, Subject)\
            .join(Chapter, Quiz.chapter_id == Chapter.id)\
            .join(Subject, Chapter.subject_id == Subject.id)\
            .filter(
                db.or_(
                    Subject.name.ilike(f'%{query}%'),
                    Chapter.name.ilike(f'%{query}%'),
                    Quiz.remarks.ilike(f'%{query}%')
                )
            )\
            .filter(Quiz.is_flagged == False)\
            .filter(Subject.is_flagged == False)\
            .all()
        
        results = []
        for quiz, chapter, subject in search_results:
            question_count = Question.query.filter_by(quiz_id=quiz.id, is_flagged=False).count()
            
            
            user_best = db.session.query(db.func.max(Score.total_scored))\
                .filter(Score.quiz_id == quiz.id, Score.user_id == current_user.id).scalar() or 0
            
            results.append({
                "quiz_id": quiz.id,
                "subject_name": subject.name,
                "chapter_name": chapter.name,
                "time_duration": quiz.time_duration,
                "question_count": question_count,
                "remarks": quiz.remarks,
                "user_best_score": user_best,
                "date_created": quiz.date_of_quiz.strftime("%Y-%m-%d")
            })
        
        return jsonify({
            "message": f"Found {len(results)} quiz(es) for '{query}'",
            "results": results,
            "query": query
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/user/profile', methods=['GET'])
@auth_required('token')
@roles_required('user')
def get_user_profile():
    """Get current user's profile information for navbar"""
    try:
        user = current_user
        
        
        total_attempts = Score.query.filter_by(user_id=user.id).count()
        
        return jsonify({
            "message": "User profile retrieved successfully",
            "profile": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "qualification": user.qualification,
                "dob": user.dob.strftime("%Y-%m-%d"),
                "total_quiz_attempts": total_attempts,
                "member_since": user.dob.strftime("%B %Y") 
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@routes_bp.route('/api/admin/recent-attempts', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_recent_attempts():
    """Get recent quiz attempts with user and quiz details"""
    try:
       
        recent_attempts = db.session.query(
            Score.id,
            Score.total_scored,
            Score.time_stamp_of_attempt,
            User.full_name.label('user_name'),
            Quiz.id.label('quiz_id'),
            Chapter.name.label('chapter_name'),
            Subject.name.label('subject_name')
        ).join(User, Score.user_id == User.id)\
         .join(Quiz, Score.quiz_id == Quiz.id)\
         .join(Chapter, Quiz.chapter_id == Chapter.id)\
         .join(Subject, Chapter.subject_id == Subject.id)\
         .order_by(Score.time_stamp_of_attempt.desc())\
         .limit(20).all()
        
        attempts_data = []
        for attempt in recent_attempts:
            
            total_questions = Question.query.filter_by(quiz_id=attempt.quiz_id).count()
            
            attempts_data.append({
                'id': attempt.id,
                'user_name': attempt.user_name,
                'subject_name': attempt.subject_name,
                'chapter_name': attempt.chapter_name,
                'score': attempt.total_scored,
                'total_questions': total_questions,
                'timestamp': attempt.time_stamp_of_attempt.isoformat()
            })
        
        return jsonify(attempts_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/admin/top-performers', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_top_performers():
    """Get top performing users based on total attempts and average scores"""
    try:
       
        users_with_attempts = db.session.query(
            User.id,
            User.full_name,
            User.is_flagged,
            db.func.count(Score.id).label('total_attempts')
        ).join(Score, User.id == Score.user_id)\
         .group_by(User.id, User.full_name, User.is_flagged)\
         .having(db.func.count(Score.id) >= 1)\
         .order_by(db.func.count(Score.id).desc())\
         .limit(10).all()
        
        performers_data = []
        for user in users_with_attempts:
            # Calculate average score for this user
            user_scores = db.session.query(
                Score.total_scored,
                Quiz.id.label('quiz_id')
            ).join(Quiz, Score.quiz_id == Quiz.id)\
             .filter(Score.user_id == user.id).all()
            
            if user_scores:
                total_percentage = 0
                valid_attempts = 0
                
                for score in user_scores:
                    
                    question_count = Question.query.filter_by(quiz_id=score.quiz_id).count()
                    if question_count > 0:
                        percentage = (score.total_scored / question_count) * 100
                        total_percentage += percentage
                        valid_attempts += 1
                
                avg_percentage = round(total_percentage / valid_attempts, 1) if valid_attempts > 0 else 0
            else:
                avg_percentage = 0
            
            performers_data.append({
                'user_id': user.id,
                'user_name': user.full_name,
                'is_flagged': user.is_flagged,
                'average_score': min(avg_percentage, 100), 
                'total_attempts': user.total_attempts
            })
        
       
        performers_data.sort(key=lambda x: (x['average_score'], x['total_attempts']), reverse=True)
        
        return jsonify(performers_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/admin/summary-stats', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_summary_stats():
    """Get comprehensive summary statistics for admin dashboard"""
    try:
        # Basic counts
        total_users = max(User.query.count() - 1, 0)
        total_subjects = Subject.query.count()
        total_chapters = Chapter.query.count()
        total_quizzes = Quiz.query.count()
        total_questions = Question.query.count()
        total_attempts = Score.query.count()
        
     
        flagged_users = User.query.filter_by(is_flagged=True).count()
        flagged_subjects = Subject.query.filter_by(is_flagged=True).count()
        flagged_quizzes = Quiz.query.filter_by(is_flagged=True).count()
        flagged_questions = Question.query.filter_by(is_flagged=True).count()
        
       
        average_score = 0
        if total_attempts > 0:
           
            score_data = db.session.query(
                Score.total_scored,
                db.func.count(Question.id).label('total_questions')
            ).join(Quiz, Score.quiz_id == Quiz.id)\
             .join(Question, Quiz.id == Question.quiz_id)\
             .group_by(Score.id, Score.total_scored).all()
            
            if score_data:
                total_percentage = sum((score.total_scored / score.total_questions) * 100 for score in score_data if score.total_questions > 0)
                average_score = round(total_percentage / len(score_data), 1) if len(score_data) > 0 else 0
        
      
        subject_stats = db.session.query(
            Subject.id,
            Subject.name,
            Subject.is_flagged,
            db.func.count(Chapter.id).label('chapter_count')
        ).outerjoin(Chapter, Subject.id == Chapter.subject_id)\
         .group_by(Subject.id, Subject.name, Subject.is_flagged)\
         .all()
        
        subjects_data = []
        for subject in subject_stats:
            subjects_data.append({
                'id': subject.id,
                'name': subject.name,
                'chapters': subject.chapter_count,
                'is_flagged': subject.is_flagged
            })
        
        return jsonify({
            'summary': {
                'totalUsers': total_users,
                'totalSubjects': total_subjects,
                'totalChapters': total_chapters,
                'totalQuizzes': total_quizzes,
                'totalQuestions': total_questions,
                'totalAttempts': total_attempts,
                'averageScore': average_score,
                'flaggedUsers': flagged_users,
                'flaggedSubjects': flagged_subjects,
                'flaggedQuizzes': flagged_quizzes,
                'flaggedQuestions': flagged_questions
            },
            'subjectStats': subjects_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes_bp.route('/api/admin/user-activity', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_user_activity():
    """Get user activity statistics"""
    try:
        
        user_activity = db.session.query(
            User.id,
            User.full_name,
            User.email,
            User.is_flagged,
            db.func.count(Score.id).label('total_attempts'),
            db.func.max(Score.time_stamp_of_attempt).label('last_activity')
        ).outerjoin(Score, User.id == Score.user_id)\
         .group_by(User.id, User.full_name, User.email, User.is_flagged)\
         .order_by(db.func.max(Score.time_stamp_of_attempt).desc().nullslast())\
         .all()
        
        activity_data = []
        for user in user_activity:
            # Calculate average score for this user
            avg_score = 0
            if user.total_attempts and user.total_attempts > 0:
                user_scores = db.session.query(
                    Score.total_scored,
                    db.func.count(Question.id).label('total_questions')
                ).join(Quiz, Score.quiz_id == Quiz.id)\
                 .join(Question, Quiz.id == Question.quiz_id)\
                 .filter(Score.user_id == user.id)\
                 .group_by(Score.id, Score.total_scored).all()
                
                if user_scores:
                    total_percentage = sum((score.total_scored / score.total_questions) * 100 for score in user_scores if score.total_questions > 0)
                    avg_score = round(total_percentage / len(user_scores), 1) if len(user_scores) > 0 else 0
            
            activity_data.append({
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'is_flagged': user.is_flagged,
                'total_attempts': user.total_attempts or 0,
                'last_activity': user.last_activity.isoformat() if user.last_activity else None,
                'avg_score': avg_score
            })
        
        return jsonify(activity_data), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ===== ADMIN CSV EXPORT ROUTES =====

@routes_bp.route('/api/admin/export-csv', methods=['POST'])
@auth_required('token')
@roles_required('admin')
def trigger_admin_csv_export():
    """Trigger async CSV export job for admin dashboard"""
    try:
        # Start the async task
        result = csv_report.delay()
        
        return jsonify({
            "status": "success",
            "message": "CSV export job started successfully",
            "job_id": result.id,
            "estimated_time": "2-5 minutes depending on data size"
        }), 202
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to start CSV export: {str(e)}"
        }), 500


@routes_bp.route('/api/admin/export-status/<job_id>', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_export_status(job_id):
    """Check the status of CSV export job"""
    try:
        result = AsyncResult(job_id)
        
        if result.state == 'PENDING':
            response = {
                "status": "pending",
                "message": "CSV export is in progress...",
                "progress": "Processing user data"
            }
        elif result.state == 'SUCCESS':
            response = {
                "status": "completed",
                "message": "CSV export completed successfully",
                "result": result.result,
                "download_ready": True
            }
        elif result.state == 'FAILURE':
            response = {
                "status": "failed",
                "message": "CSV export failed",
                "error": str(result.info)
            }
        else:
            response = {
                "status": result.state.lower(),
                "message": f"Export status: {result.state}",
                "info": str(result.info) if result.info else None
            }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to get export status: {str(e)}"
        }), 500


@routes_bp.route('/api/admin/download-csv/<filename>', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def download_admin_csv(filename):
    """Download the generated CSV file"""
    try:
        static_folder = os.path.join(current_app.root_path, 'static')
        filepath = os.path.join(static_folder, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "File not found or expired"}), 404
        
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=filename,
            mimetype='text/csv'
        )
        
    except Exception as e:
        return jsonify({"error": f"Download failed: {str(e)}"}), 500


@routes_bp.route('/api/admin/export-history', methods=['GET'])
@auth_required('token')
@roles_required('admin')
def get_export_history():
    """Get list of previously generated CSV files"""
    try:
        static_folder = os.path.join(current_app.root_path, 'static')
        
        if not os.path.exists(static_folder):
            return jsonify({"exports": []}), 200
        
        # Get all CSV files
        csv_files = []
        for filename in os.listdir(static_folder):
            if filename.startswith('admin_quiz_report_') and filename.endswith('.csv'):
                filepath = os.path.join(static_folder, filename)
                file_stats = os.stat(filepath)
                
                csv_files.append({
                    "filename": filename,
                    "created_at": datetime.fromtimestamp(file_stats.st_ctime).strftime("%Y-%m-%d %H:%M:%S"),
                    "file_size": f"{file_stats.st_size / 1024:.1f} KB",
                    "download_url": f"/api/admin/download-csv/{filename}"
                })
        
       
        csv_files.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "message": "Export history retrieved successfully",
            "exports": csv_files[:10] 
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to get export history: {str(e)}"}), 500


# ===== USER CSV EXPORT ROUTES =====

@routes_bp.route('/api/user/export-csv', methods=['POST'])
@auth_required('token')
@roles_required('user')
def trigger_user_csv_export():
    """Trigger async CSV export for current user's quiz history"""
    try:
        from .tasks import user_quiz_history_csv
        
       
        result = user_quiz_history_csv.delay(current_user.id)
        
        return jsonify({
            "status": "success",
            "message": "Your quiz history export has been started",
            "job_id": result.id,
            "estimated_time": "1-2 minutes"
        }), 202
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to start export: {str(e)}"
        }), 500


@routes_bp.route('/api/user/export-status/<job_id>', methods=['GET'])
@auth_required('token')
@roles_required('user')
def get_user_export_status(job_id):
    """Check status of user's CSV export job"""
    try:
        result = AsyncResult(job_id)
        
        if result.state == 'PENDING':
            response = {
                "status": "pending",
                "message": "Preparing your quiz history...",
                "progress": "Processing your attempts"
            }
        elif result.state == 'SUCCESS':
            response = {
                "status": "completed",
                "message": "Your quiz history is ready for download!",
                "result": result.result,
                "download_ready": True
            }
        elif result.state == 'FAILURE':
            response = {
                "status": "failed",
                "message": "Export failed. Please try again.",
                "error": str(result.info)
            }
        else:
            response = {
                "status": result.state.lower(),
                "message": f"Export status: {result.state}"
            }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to get status: {str(e)}"
        }), 500


@routes_bp.route('/api/user/download-csv/<filename>', methods=['GET'])
@auth_required('token')
@roles_required('user')
def download_user_csv(filename):
    """Download user's quiz history CSV"""
    try:
        
        if not filename.startswith(f'user_{current_user.id}_quiz_history_'):
            return jsonify({"error": "Unauthorized access"}), 403
        
        static_folder = os.path.join(current_app.root_path, 'static')
        filepath = os.path.join(static_folder, filename)
        
        if not os.path.exists(filepath):
            return jsonify({"error": "File not found or expired"}), 404
        
        return send_file(
            filepath,
            as_attachment=True,
            download_name=f"my_quiz_history_{datetime.now().strftime('%Y%m%d')}.csv",
            mimetype='text/csv'
        )
        
    except Exception as e:
        return jsonify({"error": f"Download failed: {str(e)}"}), 500




@routes_bp.route('/api/admin/cleanup-exports', methods=['DELETE'])
@auth_required('token')
@roles_required('admin')
def cleanup_old_exports():
    """Clean up CSV files older than 7 days"""
    try:
        static_folder = os.path.join(current_app.root_path, 'static')
        
        if not os.path.exists(static_folder):
            return jsonify({"message": "No files to clean"}), 200
        
        deleted_count = 0
        current_time = datetime.now().timestamp()
        
        for filename in os.listdir(static_folder):
            if filename.endswith('.csv') and ('admin_quiz_report_' in filename or 'user_' in filename):
                filepath = os.path.join(static_folder, filename)
                file_age_days = (current_time - os.path.getctime(filepath)) / (24 * 3600)
                
                
                if file_age_days > 7:
                    os.remove(filepath)
                    deleted_count += 1
        
        return jsonify({
            "message": f"Cleanup completed. {deleted_count} old files removed.",
            "deleted_files": deleted_count
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Cleanup failed: {str(e)}"}), 500

