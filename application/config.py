import os


class Config():
 DEBUG=False
 SQLALCHEMY_TRACK_MODIFICATIONS=True

class LocalDevelopmentConfig(Config):
 #configure
 SQLALCHEMY_DATABASE_URI="sqlite:///quiz.sqlite3"
 DEBUG=True
 # Secrets come from environment variables; the fallbacks are for local development only.
 SECRET_KEY=os.environ.get("SECRET_KEY", "dev-only-change-me") #hash user creds in session
 SECURITY_PASSWORD_HASH="bcrypt" #mechanism for hashing
 SECURITY_PASSWORD_SALT=os.environ.get("SECURITY_PASSWORD_SALT", "dev-only-change-me") #helps in hashing password
 WTF_CSRF_ENABLED=False #
 SECURITY_TOKEN_AUTHENTICATION_HEADER="Authentication-Token"
