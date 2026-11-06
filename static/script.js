import home from "./components/home.js"
import login from "./components/login.js"
import register from "./components/register.js"
import foot from "./components/foot.js"
import Quizadmin from "./components/Quizadmin.js"
import admindashboard from "./components/admindashboard.js"
import AddSubjectForm from "./components/AddSubjectForm.js"
import AddChapterForm from "./components/AddChapterForm.js"
import EditChapterForm from "./components/EditChapterForm.js"
import EditSubjectForm  from "./components/EditSubjectForm.js"
import UserDashboard    from "./components/UserDashboard.js"
import QuizAttemptPage    from "./components/QuizAttemptPage.js"
import Summary   from "./components/Summary.js"


const routes=[
    {path:'/',component:home},
    {path:'/login',component:login},
    {path:'/register',component:register},
    {path:'/admindashboard',component:admindashboard},
    {path:'/AddSubjectForm',component:AddSubjectForm},
    {path:'/AddChapterForm',component:AddChapterForm},
    {path:'/EditChapterForm ',component:EditChapterForm},
    {path:'/EditSubjectForm',component:EditSubjectForm},
    {path:'/Quizadmin',component:Quizadmin},
    {path:'/UserDashboard',component:UserDashboard},
    {path:'/QuizAttemptPage',component:QuizAttemptPage},
    {path:'/Summary',component:Summary}
]

const router=new VueRouter({
    routes //routes:routes
})
const app =new Vue({
    el: "#app",
    router,// router :router
    template:`
    <div class=container>
        <router-view></router-view >
        <foot></foot>
    </div>
    `,
    data: {
        section:"Frontend"

    },
    components:{ 
        "foot":foot

    }
})