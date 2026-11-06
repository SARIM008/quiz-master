from flask_mail import Message
from flask import current_app, render_template
from application.extensions import mail

def send_email(subject, recipients, html_body, text_body=None):
    """
    Send email using Flask-Mail
    """
    try:
        msg = Message(
            subject=subject,
            recipients=recipients,
            html=html_body,
            body=text_body
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
        return False

def send_monthly_report_email(user_email, user_name, report_data):
    """
    Send monthly activity report to user
    """
    subject = f"Monthly Quiz Activity Report - {report_data['month_year']}"
    
    
    html_body = render_template(
        'emails/monthly_report.html',
        user_name=user_name,
        report_data=report_data
    )
    
    
    text_body = f"""
    Dear {user_name},
    
    Here's your monthly quiz activity report for {report_data['month_year']}:
    
    Total Quizzes Taken: {report_data['total_quizzes']}
    Average Score: {report_data['average_score']}%
    Best Score: {report_data['best_score']}%
    Total Time Spent: {report_data['total_time_spent']} minutes
    Performance Category: {report_data['performance_category']}
    
    Keep up the excellent work!
    
    Best regards,
    Quiz App Team
    """
    
    return send_email(
        subject=subject,
        recipients=[user_email],
        html_body=html_body,
        text_body=text_body
    )

def send_daily_reminder_email(user_email, user_name):
    """
    Send daily study reminder to user
    """
    subject = " Daily Quiz Reminder - Keep Learning!"
    
    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;"> Quiz Time!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Hey {user_name}, ready for today's learning challenge?</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;"> Why daily practice matters:</h3>
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
            <p>Keep up the great work! </p>
            <p style="font-size: 12px;">This is an automated reminder. You can unsubscribe anytime.</p>
        </div>
    </div>
    """
    
    text_body = f"""
    Hi {user_name},
    
    This is a friendly reminder to take your daily quiz practice!
    
    Consistent practice helps you:
    - Improve your knowledge retention
    - Build confidence for exams
    - Track your learning progress
    
    Start your quiz today and keep up the momentum!
    
    Best regards,
    Quiz App Team
    """
    
    return send_email(
        subject=subject,
        recipients=[user_email],
        html_body=html_body,
        text_body=text_body
    )