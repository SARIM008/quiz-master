export default {
    template: `
    <div class="container text-center mt-5">
        <h1 class="display-4 fw-bold">Welcome to Quiz Master</h1>
        <p class="lead">Your Ultimate Exam Preparation Platform</p>
        
        <div class="mt-4">
            <a href="#/login" class="btn btn-primary btn-lg me-3">Login</a>
            <a href="#/register" class="btn btn-outline-primary btn-lg">Register</a>
        </div>

        <div class="row mt-5">
            <div class="col-md-4">
                <i class="bi bi-mortarboard-fill fs-1 text-primary"></i>
                <h3 class="mt-3">Engaging Quizzes</h3>
                <p>Practice with a wide range of quizzes curated by experts.</p>
            </div>
            <div class="col-md-4">
                <i class="bi bi-bar-chart-line-fill fs-1 text-primary"></i>
                <h3 class="mt-3">Performance Insights</h3>
                <p>Track your progress with real-time analytics and reports.</p>
            </div>
            <div class="col-md-4">
                <i class="bi bi-award-fill fs-1 text-primary"></i>
                <h3 class="mt-3">Earn Badges</h3>
                <p>Compete with peers and earn badges for your achievements.</p>
            </div>
        </div>
    </div>
    `
}
