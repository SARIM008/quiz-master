from flask import current_app

def get_cache():
    try:
        cache = current_app.extensions.get('cache')
        if cache is None:
            print("Warning: Cache not initialized, skipping cache operations")
        return cache
    except Exception as e:
        print(f"Cache error: {e}")
        return None

def clear_subjects_cache():
    cache = get_cache()
    if cache:
        cache.delete("all_subjects")
    
def clear_chapters_cache():
    cache = get_cache()
    if cache:
        cache.delete("all_chapters")
    
def clear_quiz_questions_cache():
    cache = get_cache()
    if cache:
        cache.delete("admin_quizzes_with_questions")

def clear_subject_cache(subject_id):
    cache = get_cache()
    if cache:
        cache.delete(f"subject_{subject_id}")
        clear_subjects_cache()
    
def clear_chapter_cache(chapter_id):
    cache = get_cache()
    if cache:
        cache.delete(f"chapter_{chapter_id}")
        clear_chapters_cache()

def clear_quiz_cache(quiz_id):
    cache = get_cache()
    if cache:
        cache.delete(f"quiz_{quiz_id}")
        clear_quiz_questions_cache()