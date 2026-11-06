from flask_restful import Api, Resource, reqparse
from .models import *
from flask import jsonify
from flask_security import auth_required, roles_required, current_user
from datetime import datetime
from pytz import timezone
from .cache_utils import get_cache, clear_subjects_cache, clear_subject_cache, clear_chapters_cache, clear_chapter_cache, clear_quiz_questions_cache


api=Api()



ist = timezone('Asia/Kolkata')  
# Parser for User
user_parser = reqparse.RequestParser()
user_parser.add_argument('full_name', type=str, required=False)
user_parser.add_argument('qualification', type=str, required=False)
user_parser.add_argument('dob', type=str, required=False)
user_parser.add_argument('is_flagged', type=bool, required=False) 

class UserResource(Resource):
    @auth_required('token')
    def get(self, user_id=None):
        """Get user details (only self for normal users, all for admin)."""
        if user_id:
            user = User.query.get(user_id)
            if not user:
                return {"message": "User not found"}, 404

            
            if "admin" not in [role.name for role in current_user.roles] and user_id != current_user.id:
                return {"message": "Unauthorized access"}, 403

            return {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "qualification": user.qualification,
                "dob": str(user.dob),
                "is_flagged": user.is_flagged
            }, 200

       
        if "admin" not in [role.name for role in current_user.roles]:
            return {"message": "Unauthorized access"}, 403

        users = User.query.all()
        return [{
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "is_flagged": u.is_flagged,
            "qualification": u.qualification,
            "dob": str(u.dob),
            'roles': [role.name for role in u.roles] 
        } for u in users], 200

    @auth_required('token')
    def put(self, user_id):
        """Update user details (self only for normal users)."""
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404

        #self-update,
        if "admin" not in [role.name for role in current_user.roles] and user_id != current_user.id:
            return {"message": "Unauthorized to update other users"}, 403

        args = user_parser.parse_args()
        user.full_name = args["full_name"] or user.full_name
        user.qualification = args["qualification"] or user.qualification
        user.dob = datetime.strptime(args["dob"], '%Y-%m-%d').date() if args["dob"] else user.dob
        user.is_flagged = args.get("is_flagged", user.is_flagged)  # Only update if provided

        db.session.commit()
        return {"message": "User updated successfully!"}, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, user_id):
        """Admin can delete a user."""
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404

        db.session.delete(user)
        db.session.commit()
        return {"message": "User deleted successfully!"}, 200

    @auth_required('token')
    @roles_required('admin')
    def patch(self, user_id):
        """Update only the flag status of a user (Admin only)."""
        user = User.query.get(user_id)
        if not user:
            return {"message": "User not found"}, 404

        args = reqparse.RequestParser()
        args.add_argument('is_flagged', type=bool, required=True, help="Flag status is required")
        flag_data = args.parse_args()

        previous_status = user.is_flagged
        user.is_flagged = flag_data["is_flagged"]
        db.session.commit()

        return {
            "message": "Flag status updated successfully!",
            "previous_status": previous_status,
            "new_status": user.is_flagged
        }, 200


api.add_resource(UserResource, 
                 '/api/users', 
                 '/api/users/<int:user_id>')




# Parser for Subject
# CACHED SUBJECT RESOURCE
parser = reqparse.RequestParser()
parser.add_argument('name', required=True, help="Subject name is required")
parser.add_argument('description')
parser.add_argument('is_flagged', type=bool, required=False)

class SubjectResource(Resource):
    @auth_required('token')
    def get(self, subject_id=None):
        cache = get_cache()
        
        if subject_id:
            cache_key = f"subject_{subject_id}"
            cached_subject = None
            
            # Safe cache retrieval - don't let cache errors break the API
            if cache:
                try:
                    cached_subject = cache.get(cache_key)
                except Exception as e:
                    print(f"Cache get error: {e}")
            
            if cached_subject:
                return cached_subject, 200
                
            subject = Subject.query.get(subject_id)
            if not subject:
                return {"message": "Subject not found"}, 404
                
            subject_data = {
                "id": subject.id,
                "name": subject.name,
                "description": subject.description,
                "is_flagged": subject.is_flagged
            }
            
            # Safe cache storage - don't let cache errors break the API
            if cache:
                try:
                    cache.set(cache_key, subject_data, timeout=600)
                except Exception as e:
                    print(f"Cache set error: {e}")
            
            return subject_data, 200

        # Get all subjects
        cache_key = "all_subjects"
        cached_subjects = None
        
        if cache:
            try:
                cached_subjects = cache.get(cache_key)
            except Exception as e:
                print(f"Cache get error: {e}")
        
        if cached_subjects:
            return cached_subjects, 200
            
        subjects = Subject.query.all()
        subjects_data = [{
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "is_flagged": s.is_flagged
        } for s in subjects]
        
        if cache:
            try:
                cache.set(cache_key, subjects_data, timeout=300)
            except Exception as e:
                print(f"Cache set error: {e}")
        
        return subjects_data, 200

    @auth_required('token')
    @roles_required('admin')
    def post(self):
        """Create a new subject - cache failures won't affect success"""
        args = parser.parse_args()
        
        # Database operation in its own try-catch
        try:
            # Check for duplicate subject names
            existing_subject = Subject.query.filter_by(name=args["name"]).first()
            if existing_subject:
                return {"message": "Subject with this name already exists"}, 409
            
            # Create subject
            subject = Subject(
                name=args["name"],
                description=args["description"],
                is_flagged=args.get("is_flagged", False)
            )
            
            db.session.add(subject)
            db.session.commit()
            
            # Database operation successful - prepare success response
            success_response = {
                "message": "Subject created successfully!", 
                "id": subject.id
            }
            
        except Exception as e:
            # Database operation failed
            db.session.rollback()
            return {"message": f"Failed to create subject: {str(e)}"}, 500
        
        # Cache operation - separate try-catch so it doesn't affect success response
        try:
            clear_subjects_cache()
        except Exception as cache_error:
            print(f"Warning: Failed to clear subjects cache: {cache_error}")
            # Don't return error - database operation was successful!
        
        # Return success regardless of cache operation result
        return success_response, 201

    @auth_required('token')
    @roles_required('admin')
    def put(self, subject_id):
        """Update a subject - cache failures won't affect success"""
        args = parser.parse_args()
        
        # Database operation in its own try-catch
        try:
            subject = Subject.query.get(subject_id)
            if not subject:
                return {"message": "Subject not found"}, 404

            # Check for duplicate names (excluding current subject)
            existing_subject = Subject.query.filter(
                Subject.name == args["name"],
                Subject.id != subject_id
            ).first()
            
            if existing_subject:
                return {"message": "Subject with this name already exists"}, 409

            # Update subject
            subject.name = args["name"]
            subject.description = args["description"]
            subject.is_flagged = args.get("is_flagged", subject.is_flagged)
            
            db.session.commit()
            
            # Database operation successful
            success_response = {"message": "Subject updated successfully!"}
            
        except Exception as e:
            # Database operation failed
            db.session.rollback()
            return {"message": f"Failed to update subject: {str(e)}"}, 500
        
        # Cache operation - separate try-catch
        try:
            clear_subject_cache(subject_id)
            clear_subjects_cache()  # Also clear the all subjects cache
        except Exception as cache_error:
            print(f"Warning: Failed to clear subject cache: {cache_error}")
        
        # Return success regardless of cache operation result
        return success_response, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, subject_id):
        """Delete a subject - cache failures won't affect success"""
        
        # Database operation in its own try-catch
        try:
            subject = Subject.query.get(subject_id)
            if not subject:
                return {"message": "Subject not found"}, 404

            db.session.delete(subject)
            db.session.commit()
            
            # Database operation successful
            success_response = {"message": "Subject deleted successfully!"}
            
        except Exception as e:
            # Database operation failed  
            db.session.rollback()
            return {"message": f"Failed to delete subject: {str(e)}"}, 500
        
        # Cache operation - separate try-catch
        try:
            clear_subject_cache(subject_id)
            clear_subjects_cache()  # Also clear the all subjects cache
        except Exception as cache_error:
            print(f"Warning: Failed to clear subject cache: {cache_error}")
        
        # Return success regardless of cache operation result
        return success_response, 200

    @auth_required('token')
    @roles_required('admin')
    def patch(self, subject_id):
        """Update flag status of a subject - cache failures won't affect success"""
        
        # Database operation in its own try-catch
        try:
            subject = Subject.query.get(subject_id)
            if not subject:
                return {"message": "Subject not found"}, 404

            args = reqparse.RequestParser()
            args.add_argument('is_flagged', type=bool, required=True, help="Flag status is required")
            flag_data = args.parse_args()

            previous_status = subject.is_flagged
            subject.is_flagged = flag_data["is_flagged"]
            db.session.commit()
            
            # Database operation successful
            success_response = {
                "message": "Flag status updated successfully!",
                "previous_status": previous_status,
                "new_status": subject.is_flagged
            }
            
        except Exception as e:
            # Database operation failed
            db.session.rollback()
            return {"message": f"Failed to update flag status: {str(e)}"}, 500
        
        # Cache operation - separate try-catch
        try:
            clear_subject_cache(subject_id)
            clear_subjects_cache()  # Also clear the all subjects cache
        except Exception as cache_error:
            print(f"Warning: Failed to clear subject cache: {cache_error}")
        
        # Return success regardless of cache operation result
        return success_response, 200

api.add_resource(SubjectResource, '/api/subjects', '/api/subjects/<int:subject_id>')



# Parser for Chapter
# CACHED CHAPTER RESOURCE
chapter_parser = reqparse.RequestParser()
chapter_parser.add_argument('name', required=True, help="Chapter name is required")
chapter_parser.add_argument('description')
chapter_parser.add_argument('subject_id', type=int, required=True, help="Subject ID is required")

# Fixed Chapter Resource - Cache failures won't affect API responses
class ChapterResource(Resource):
    @auth_required('token')
    def get(self, chapter_id=None):
        cache = get_cache()
        
        if chapter_id:
            cache_key = f"chapter_{chapter_id}"
            cached_chapter = None
            
            # Safe cache retrieval
            if cache:
                try:
                    cached_chapter = cache.get(cache_key)
                except Exception as e:
                    print(f"Cache get error: {e}")
            
            if cached_chapter:
                return cached_chapter, 200
            
            chapter = Chapter.query.get(chapter_id)
            if not chapter:
                return {"message": "Chapter not found"}, 404
            
            chapter_data = {
                "id": chapter.id,
                "name": chapter.name,
                "description": chapter.description,
                "subject_id": chapter.subject_id,
                "subject_name": chapter.subject.name  
            }
            
            # Safe cache storage
            if cache:
                try:
                    cache.set(cache_key, chapter_data, timeout=600)
                except Exception as e:
                    print(f"Cache set error: {e}")
            
            return chapter_data, 200

        # Get all chapters
        cache_key = "all_chapters"
        cached_chapters = None
        
        if cache:
            try:
                cached_chapters = cache.get(cache_key)
            except Exception as e:
                print(f"Cache get error: {e}")
        
        if cached_chapters:
            return cached_chapters, 200

        chapters = Chapter.query.all()
        chapters_data = [
            {
                "id": c.id,
                "name": c.name,
                "description": c.description,
                "subject_id": c.subject_id,
                "subject_name": c.subject.name  
            }
            for c in chapters
        ]
        
        if cache:
            try:
                cache.set(cache_key, chapters_data, timeout=300)
            except Exception as e:
                print(f"Cache set error: {e}")
        
        return chapters_data, 200

    @auth_required('token')
    @roles_required('admin')
    def post(self):
        """Create a new chapter - cache failures won't affect success"""
        args = chapter_parser.parse_args()
        
        # Database operation in its own try-catch
        try:
            # Validate subject exists
            subject = Subject.query.get(args["subject_id"])
            if not subject:
                return {"message": "Subject not found"}, 404
            
            # Check for duplicate chapter names within the same subject
            existing_chapter = Chapter.query.filter_by(
                name=args["name"], 
                subject_id=args["subject_id"]
            ).first()
            
            if existing_chapter:
                return {"message": "Chapter with this name already exists in the subject"}, 409
            
            # Create chapter
            chapter = Chapter(
                name=args["name"], 
                description=args["description"], 
                subject_id=args["subject_id"]
            )
            
            db.session.add(chapter)
            db.session.commit()
            
            # Database operation successful
            success_response = {
                "message": "Chapter created successfully!", 
                "id": chapter.id
            }
            
        except Exception as e:
            # Database operation failed
            db.session.rollback()
            return {"message": f"Failed to create chapter: {str(e)}"}, 500
        
        # Cache operation - separate try-catch
        try:
            clear_chapters_cache()
        except Exception as cache_error:
            print(f"Warning: Failed to clear chapters cache: {cache_error}")
        
        # Return success regardless of cache operation result
        return success_response, 201

    @auth_required('token')
    @roles_required('admin')
    def put(self, chapter_id):
        """Update a chapter - cache failures won't affect success"""
        args = chapter_parser.parse_args()
        
        # Database operation in its own try-catch
        try:
            chapter = Chapter.query.get(chapter_id)
            if not chapter:
                return {"message": "Chapter not found"}, 404
            
            # Validate subject exists
            subject = Subject.query.get(args["subject_id"])
            if not subject:
                return {"message": "Subject not found"}, 404
            
            # Check for duplicate names within the same subject (excluding current chapter)
            existing_chapter = Chapter.query.filter(
                Chapter.name == args["name"],
                Chapter.subject_id == args["subject_id"],
                Chapter.id != chapter_id
            ).first()
            
            if existing_chapter:
                return {"message": "Chapter with this name already exists in the subject"}, 409
            
            # Update chapter
            chapter.name = args["name"]
            chapter.description = args["description"]
            chapter.subject_id = args["subject_id"]
            
            db.session.commit()
            
            # Database operation successful
            success_response = {"message": "Chapter updated successfully!"}
            
        except Exception as e:
            # Database operation failed
            db.session.rollback()
            return {"message": f"Failed to update chapter: {str(e)}"}, 500
        
        # Cache operation - separate try-catch
        try:
            clear_chapter_cache(chapter_id)
            clear_chapters_cache()  # Also clear the all chapters cache
        except Exception as cache_error:
            print(f"Warning: Failed to clear chapter cache: {cache_error}")
        
        # Return success regardless of cache operation result
        return success_response, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, chapter_id):
        """Delete a chapter - cache failures won't affect success"""
        
        # Database operation in its own try-catch
        try:
            chapter = Chapter.query.get(chapter_id)
            if not chapter:
                return {"message": "Chapter not found"}, 404

            db.session.delete(chapter)
            db.session.commit()
            
            # Database operation successful
            success_response = {"message": "Chapter deleted successfully!"}
            
        except Exception as e:
            # Database operation failed
            db.session.rollback()
            return {"message": f"Failed to delete chapter: {str(e)}"}, 500
        
        # Cache operation - separate try-catch
        try:
            clear_chapter_cache(chapter_id)
            clear_chapters_cache()  # Also clear the all chapters cache
        except Exception as cache_error:
            print(f"Warning: Failed to clear chapter cache: {cache_error}")
        
        # Return success regardless of cache operation result
        return success_response, 200
api.add_resource(ChapterResource, '/api/chapters', '/api/chapters/<int:chapter_id>')

# Parser for Quiz
quiz_parser = reqparse.RequestParser()
quiz_parser.add_argument('chapter_id', type=int, required=True, help="Chapter ID is required")
quiz_parser.add_argument('time_duration')
quiz_parser.add_argument('remarks')
quiz_parser.add_argument('is_flagged', type=bool, required=False)  

class QuizResource(Resource):
    @auth_required('token')
    def get(self, quiz_id=None):
        """Get a single quiz or all quizzes"""
        if quiz_id:
            quiz = Quiz.query.get(quiz_id)
            if not quiz:
                return {"message": "Quiz not found"}, 404
            return {
                "id": quiz.id,
                "chapter_id": quiz.chapter_id,
                "time_duration": quiz.time_duration,
                "remarks": quiz.remarks,
                "is_flagged": quiz.is_flagged
            }, 200
        
        quizzes = Quiz.query.all()
        return [{
            "id": q.id,
            "chapter_id": q.chapter_id,
            "time_duration": q.time_duration,
            "remarks": q.remarks,
            "is_flagged": q.is_flagged
        } for q in quizzes], 200

    @auth_required('token')
    @roles_required('admin')
    def post(self):
        """Create a new quiz (Admin only)"""
        args = quiz_parser.parse_args()
        quiz = Quiz(
            chapter_id=args["chapter_id"],
            time_duration=args["time_duration"],
            remarks=args["remarks"],
            is_flagged=args.get("is_flagged", False)  
        )
        db.session.add(quiz)
        db.session.commit()
        return {"message": "Quiz created successfully!", "id": quiz.id}, 201

    @auth_required('token')
    @roles_required('admin')
    def put(self, quiz_id):
        """Update a quiz (Admin only)"""
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        args = quiz_parser.parse_args()
        quiz.time_duration = args["time_duration"]
        quiz.remarks = args["remarks"]
        quiz.is_flagged = args.get("is_flagged", quiz.is_flagged)  

        db.session.commit()
        return {"message": "Quiz updated successfully!"}, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, quiz_id):
        """Delete a quiz (Admin only)"""
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        db.session.delete(quiz)
        db.session.commit()
        return {"message": "Quiz deleted successfully!"}, 200

    @auth_required('token')
    @roles_required('admin')
    def patch(self, quiz_id):
        """Update only the flag status of a quiz (Admin only)"""
        quiz = Quiz.query.get(quiz_id)
        if not quiz:
            return {"message": "Quiz not found"}, 404

        args = reqparse.RequestParser()
        args.add_argument('is_flagged', type=bool, required=True, help="Flag status is required")
        flag_data = args.parse_args()

        quiz.is_flagged = flag_data["is_flagged"]
        db.session.commit()
        return {
            "message": "Flag status updated successfully!",
            "previous_status": not flag_data["is_flagged"],
            "new_status": flag_data["is_flagged"]
        }, 200


api.add_resource(QuizResource, '/api/quizzes', '/api/quizzes/<int:quiz_id>')



# Parser for Score
score_parser = reqparse.RequestParser()
score_parser.add_argument('quiz_id', type=int, required=True, help="Quiz ID is required")
score_parser.add_argument('total_scored', type=int, required=True, help="Total score is required")

class ScoreResource(Resource):
    @auth_required('token')
    def get(self, score_id=None):
        if score_id:
            score = Score.query.get(score_id)
            return {"id": score.id, "quiz_id": score.quiz_id, "user_id": score.user_id, "total_scored": score.total_scored}, 200
        
        scores = Score.query.all()
        return [{"id": s.id, "quiz_id": s.quiz_id, "user_id": s.user_id, "total_scored": s.total_scored} for s in scores], 200

    @auth_required('token')
    def post(self):
        args = score_parser.parse_args()
        score = Score(quiz_id=args["quiz_id"], user_id=current_user.id, total_scored=args["total_scored"])
        db.session.add(score)
        db.session.commit()
        return {"message": "Score recorded successfully!"}, 201

    @auth_required('token')
    @roles_required('admin')
    def delete(self, score_id):
        score = Score.query.get(score_id)
        if score:
            db.session.delete(score)
            db.session.commit()
            return {"message": "Score deleted successfully!"}, 200
        return {"message": "Score not found"}, 404

api.add_resource(ScoreResource, '/api/scores', '/api/scores/<int:score_id>')

# Parser for Question
question_parser = reqparse.RequestParser()
question_parser.add_argument('quiz_id', type=int, required=True, help="Quiz ID is required")
question_parser.add_argument('question_statement', type=str, required=True, help="Question statement is required")
question_parser.add_argument('option1', type=str, required=True, help="Option 1 is required")
question_parser.add_argument('option2', type=str, required=True, help="Option 2 is required")
question_parser.add_argument('option3', type=str, required=True, help="Option 3 is required")
question_parser.add_argument('option4', type=str, required=True, help="Option 4 is required")
question_parser.add_argument('correct_option', type=int, choices=[1, 2, 3, 4], required=True, help="Correct option must be 1, 2, 3, or 4")
question_parser.add_argument('is_flagged', type=bool, default=False)

class QuestionResource(Resource):
    @auth_required('token')
    def get(self, question_id=None):
        """Get questions """
        if question_id:
            question = Question.query.get(question_id)
            if not question:
                return {"message": "Question not found"}, 404
            return {
                "id": question.id,
                "quiz_id": question.quiz_id,
                "question_statement": question.question_statement,
                "option1": question.option1,  
                "option2": question.option2,
                "option3": question.option3,
                "option4": question.option4,
                "correct_option": question.correct_option,
                "is_flagged": question.is_flagged
            }, 200

        questions = Question.query.all()
        return [{
            "id": q.id,
            "quiz_id": q.quiz_id,
            "question_statement": q.question_statement,
            "option1": q.option1,  
            "option2": q.option2,
            "option3": q.option3,
            "option4": q.option4,
            "correct_option": q.correct_option,
            "is_flagged": q.is_flagged
        } for q in questions], 200

    @auth_required('token')
    @roles_required('admin')
    def post(self):
        """Create a new question (Admin only)"""
        args = question_parser.parse_args()

       
        if not Quiz.query.get(args["quiz_id"]):
            return {"message": "Quiz not found"}, 404

        question = Question(
            quiz_id=args["quiz_id"],
            question_statement=args["question_statement"],
            option1=args["option1"],
            option2=args["option2"],
            option3=args["option3"],
            option4=args["option4"],
            correct_option=args["correct_option"],
            is_flagged=args["is_flagged"]
        )

        db.session.add(question)
        db.session.commit()
        return {"message": "Question created successfully!", "id": question.id}, 201

    @auth_required('token')
    @roles_required('admin')
    def put(self, question_id):
        """Update a question (Admin only)"""
        question = Question.query.get(question_id)
        if not question:
            return {"message": "Question not found"}, 404

        args = question_parser.parse_args()
        question.question_statement = args["question_statement"]
        question.option1 = args["option1"]
        question.option2 = args["option2"]
        question.option3 = args["option3"]
        question.option4 = args["option4"]
        question.correct_option = args["correct_option"]
        question.is_flagged = args["is_flagged"]

        db.session.commit()
        return {"message": "Question updated successfully!"}, 200

    @auth_required('token')
    @roles_required('admin')
    def delete(self, question_id):
        """Delete a question (Admin only)"""
        question = Question.query.get(question_id)
        if not question:
            return {"message": "Question not found"}, 404

        db.session.delete(question)
        db.session.commit()
        return {"message": "Question deleted successfully!"}, 200

    @auth_required('token')
    @roles_required('admin')
    def patch(self, question_id):
        """Update only the flag status of a question (Admin only)"""
        question = Question.query.get(question_id)
        if not question:
            return {"message": "Question not found"}, 404

        args = reqparse.RequestParser()
        args.add_argument('is_flagged', type=bool, required=True, help="Flag status is required")
        flag_data = args.parse_args()

        question.is_flagged = flag_data["is_flagged"]
        db.session.commit()
        return {"message": "Flag status updated successfully!", "previous_status": not flag_data["is_flagged"], "new_status": flag_data["is_flagged"]}, 200

api.add_resource(QuestionResource, '/api/questions', '/api/questions/<int:question_id>')

class QuizBatchResource(Resource):
    @auth_required('token')
    @roles_required('admin')
    def get(self):
        cache = get_cache()
        cache_key = "admin_quizzes_with_questions"
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return cached_data, 200
        
        try:
            quizzes = Quiz.query.all()
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
                    "time_duration": quiz.time_duration,
                    "remarks": quiz.remarks,
                    "is_flagged": quiz.is_flagged,
                    "questions": question_list
                }
                quiz_data.append(quiz_info)
            
            cache.set(cache_key, quiz_data, timeout=600)
            return quiz_data, 200
            
        except Exception as e:
            return {"error": str(e)}, 500

api.add_resource(QuizBatchResource, '/api/admin/quizzes_with_questions')


def start_quiz(quiz_id):
    quiz_data = db.session.query(Quiz, Chapter, Subject)\
        .join(Chapter, Quiz.chapter_id == Chapter.id)\
        .join(Subject, Chapter.subject_id == Subject.id)\
        .filter(Quiz.id == quiz_id).first()
    
    if not quiz_data:
        return jsonify({"error": "Quiz not found"}), 404
        
    quiz, chapter, subject = quiz_data

    questions = Question.query.filter_by(quiz_id=quiz_id, is_flagged=False).all()
    question_list = [{
        "id": q.id,
        "question": q.question_statement,
        "options": [q.option1, q.option2, q.option3, q.option4]
    } for q in questions]

    return jsonify({
        "quiz_id": quiz.id,
        "chapter_id": quiz.chapter_id,
        "chapter_name": chapter.name,
        "subject_name": subject.name,
        "date_of_quiz": quiz.date_of_quiz.strftime("%Y-%m-%d"),
        "time_duration": quiz.time_duration,
        "questions": question_list
    })

@auth_required('token')
def submit_quiz(data):
    user_id = current_user.id
    quiz_id = data.get("quiz_id")
    user_answers = data.get("answers")

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    correct_answers = {q.id: int(q.correct_option) for q in questions}
    total_score = 0

    for q_id, ans in user_answers.items():
        q_id = int(q_id)
        ans = int(ans)
        
        if correct_answers.get(q_id) == ans:
            total_score += 1

    new_score = Score(user_id=user_id, quiz_id=quiz_id, total_scored=total_score, time_stamp_of_attempt=datetime.utcnow())
    db.session.add(new_score)
    db.session.commit()

    return jsonify({"message": "Quiz submitted successfully", "score": total_score})

@auth_required('token')
def view_scores():
    user_id = current_user.id
    scores = Score.query.filter_by(user_id=user_id).all()

    score_list = [{
        "quiz_id": s.quiz_id,
        "score": s.total_scored,
        "timestamp": s.time_stamp_of_attempt.replace(tzinfo=timezone('UTC')).astimezone(ist).strftime("%Y-%m-%d %H:%M")
    } for s in scores]

    return jsonify({"scores": score_list})






