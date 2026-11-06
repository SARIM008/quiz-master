from flask import Flask
from application.database import db
from application.models import User, Role
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore
from flask_bcrypt import Bcrypt
from flask_caching import Cache
from datetime import datetime  
from application.celery_init import celery_init_app
from celery.schedules import crontab
from flask_mail import Mail
from application.extensions import mail

bcrypt = Bcrypt()
cache = Cache()

def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    
    # Redis Cache Configuration
    app.config['CACHE_TYPE'] = 'redis'
    app.config['CACHE_REDIS_HOST'] = 'localhost'
    app.config['CACHE_REDIS_PORT'] = 6379
    app.config['CACHE_REDIS_DB'] = 0
    app.config['CACHE_REDIS_URL'] = 'redis://localhost:6379/0'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    
    db.init_app(app)
    cache.init_app(app)
    
    # Import resources after cache initialization
    from application.resources import api
    api.init_app(app)

    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)

    with app.app_context():
        db.create_all()
        create_admin(datastore)
        create_test_user(datastore)

    return app

def create_admin(datastore):
    admin_email = "admin@gmail.com"
    admin_password = "admin123"

    if not Role.query.filter_by(name="admin").first():
        role = Role(name="admin")
        db.session.add(role)
        db.session.commit()

    admin_user = User.query.filter_by(email=admin_email).first()
    if not admin_user:
        admin_user = datastore.create_user(
            email=admin_email,
            full_name="Admin",
            dob=datetime.strptime("2000-01-01", "%Y-%m-%d").date(),
            active=True,
            password=bcrypt.generate_password_hash(admin_password).decode('utf-8')
        )
        db.session.commit()
        datastore.add_role_to_user(admin_user, "admin")
        db.session.commit() 

    print("Admin user initialized.")

def create_test_user(datastore):
    test_email = "testuser@gmail.com"
    test_password = "test123"

    if not Role.query.filter_by(name="user").first():
        role = Role(name="user")
        db.session.add(role)
        db.session.commit()

    test_user = User.query.filter_by(email=test_email).first()
    if not test_user:
        test_user = datastore.create_user(
            email=test_email,
            full_name="Test User",
            dob=datetime.strptime("2005-06-15", "%Y-%m-%d").date(),
            active=True,
            password=bcrypt.generate_password_hash(test_password).decode('utf-8')
        )
        db.session.commit()
        datastore.add_role_to_user(test_user, "user")
        db.session.commit()

    print("Test user initialized.")

app = create_app()
celery = celery_init_app(app)

# Mail Configuration
app.config['MAIL_SERVER'] = 'localhost'
app.config['MAIL_PORT'] = 1025
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = None  
app.config['MAIL_PASSWORD'] = None
app.config['MAIL_DEFAULT_SENDER'] = 'noreply@quizapp.com'
mail.init_app(app)

# Celery Beat schedule
celery.conf.beat_schedule = {
    'monthly-report-production': {
        'task': 'monthly_report',  
        'schedule': crontab(minute=0, hour=9, day_of_month=1),
    },
    'daily-quiz-reminder-gchat': {
        'task': 'daily_quiz_reminder',
        'schedule': crontab(minute=0, hour=18),
    },
}

celery.conf.timezone = 'Asia/Kolkata'  
celery.autodiscover_tasks()

from application.routes import routes_bp
app.register_blueprint(routes_bp)

if __name__ == "__main__":
    app.run(debug=True)