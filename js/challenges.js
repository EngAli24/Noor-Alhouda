function showLoginRequired() {
    const AuthHTML = `
      <div id="azkarLoginModal" class="auth-modal show">
        <div class="auth-modal-card">
          <h2>🔐 الدخول إلزامي</h2>
          <p>عذراً، يجب تسجيل الدخول أولاً لتتمكن من الوصول إلى صفحة التحديات واحتساب النقاط.</p>
          <button class="auth-modal-btn" onclick="redirectToLogin('/challenges')">تسجيل الدخول الآن</button>
          <button class="auth-close-btn" onclick="exitPage()">إلغاء والعودة للخلف</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', AuthHTML);
    document.body.style.overflow = "hidden";
}

function exitPage() {
    if (document.referrer !== "") {
        window.history.back();
    } else {
        window.location.href = "/"; 
    }
}

function redirectToLogin(page) {
    localStorage.setItem("returnUrl", page);
    window.location.href = "login.html";
}

if (localStorage.getItem("isLoggedIn") !== "true") {
    showLoginRequired();
}

const list = document.getElementById("tasks");
const fill = document.getElementById("fill");
const total = document.getElementById("total");
const modal = document.getElementById("modal");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [
 { id:"fajr", name:"صلاة الفجر في وقتها", points:30, required:true },
 { id:"azkar", name:"ورد الأذكار", points:40, required:true },
 { id:"quran", name:"قراءة الجزء اليومي", points:20, required:true },
 { id:"study", name:"المذاكرة", points:30, required:true },
 { id:"taraweeh", name:"صلاة التراويح", points:30, required:false }
];

function save(){
 localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addDailyPoints(points){
 const today = new Date().toISOString().split("T")[0];
 const key = "score-" + today;
 const old = Number(localStorage.getItem(key)) || 0;
 localStorage.setItem(key, old + points);
}

function addSecondaryToday(points){
 const today = new Date().toISOString().split("T")[0];
 const key = "secondary-" + today;
 const old = Number(localStorage.getItem(key)) || 0;
 localStorage.setItem(key, old + points);
}

function removePoints(points){
 const today = new Date().toISOString().split("T")[0];
 const key1 = "score-" + today;
 const key2 = "secondary-" + today;
 const old1 = Number(localStorage.getItem(key1)) || 0;
 const old2 = Number(localStorage.getItem(key2)) || 0;
 localStorage.setItem(key1, Math.max(0, old1 - points));
 localStorage.setItem(key2, Math.max(0, old2 - points));
}

function render(){
 let donePoints = 0; let totalPoints = 0; let doneRequired = true;
 list.innerHTML = "";

 tasks.forEach(t=>{
  totalPoints += t.points;
  if(t.done) donePoints += t.points;
  if(t.required && !t.done) doneRequired = false;

  list.innerHTML += `
   <div class="task ${t.done ? "done" : ""}" onclick="toggle('${t.id}')">
    <span>${t.name}</span>
    <span class="points">${t.points ? `(${t.points} نقطة)` : "إجباري"}</span>
   </div>
  `;
 });

 const percent = totalPoints ? (donePoints / totalPoints) * 100 : 100;
 fill.style.width = percent + "%";
 total.innerText = `مجموع نقاط اليوم: ${donePoints}`;

 if(doneRequired && percent === 100) modal.classList.add("show");
}

function toggle(id){
 tasks = tasks.map(t=>{
  if(String(t.id) === String(id)){
   if(!t.done){
    addDailyPoints(t.points);
    addSecondaryToday(t.points);
   } else {
    removePoints(t.points);
   }
   t.done = !t.done;
  }
  return t;
 });
 save();
 render();
 syncToServer(); 
}

function addTask(){
 const val = document.getElementById("newTask").value.trim();
 if(!val) return;
 tasks.push({ id:Date.now(), name:val, points:0, required:true, done:false });
 document.getElementById("newTask").value="";
 save();
 render();
 syncToServer(); 
}

function closeModal(){ modal.classList.remove("show"); }

function syncToServer() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const dataToSync = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!["token", "isLoggedIn", "activeUser", "userBio", "returnUrl"].includes(key)) {
            dataToSync[key] = localStorage.getItem(key);
        }
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/user/sync", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.send(JSON.stringify(dataToSync));
}

render();