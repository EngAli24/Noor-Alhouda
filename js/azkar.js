const cardsContainer = document.getElementById("azkarCards");
const listContainer  = document.getElementById("azkarList");

let AZKAR_LIBRARY = []; // هنخزن هنا الأذكار
let azkarDone = JSON.parse(localStorage.getItem("azkarDone")) || [];
let lastDay = localStorage.getItem("zekrDay") || "";
let streak = Number(localStorage.getItem("zekrStreak")) || 0;

function addSecondaryToday(points){
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const key = "secondary-" + today;
    const old = Number(localStorage.getItem(key)) || 0;
    localStorage.setItem(key, old + points);
}

// ==========================================
// جلب الأذكار من قاعدة البيانات بالـ AJAX
// ==========================================
function fetchAzkarFromDB() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/data/azkar", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            AZKAR_LIBRARY = JSON.parse(xhr.responseText);
        }
    };
    xhr.send();
}

const categories = [
 ["morning","🌅 أذكار الصباح"], ["evening","🌙 أذكار المساء"],
 ["wake","⏰ أذكار الاستيقاظ"], ["sleep","😴 أذكار النوم"],
 ["prayer","🕌 أذكار بعد الصلاة"], ["food","🍽 أذكار الطعام"],
 ["ramadan","🌙 أدعية رمضانية"], ["daily","📆 أذكار يومية"],
 ["quran_dua","📖 أدعية قرآنية"], ["general","🤲 جوامع الدعاء"],
 ["tasbeeh","📿 السبحة الإلكترونية"]
];

categories.forEach(c=>{
 const div=document.createElement("div");
 div.className="azkar-card";        
 div.textContent=c[1];
 div.onclick=()=>openCategory(c[0]);
 cardsContainer.appendChild(div);
});

function openCategory(type){
 listContainer.innerHTML="";
 if(type==="tasbeeh"){ openTasbeeh(); return; }

 const items = AZKAR_LIBRARY.filter(z=>z.category===type);
 let doneCount=0;

 if(items.length === 0) {
     listContainer.innerHTML="<p>جاري تحميل الأذكار أو لا توجد أذكار...</p>";
     return;
 }

 items.forEach(z=>{
  const card=document.createElement("div");
  card.className="zekr-card";     
  let counter=0;

  card.innerHTML=`
   <h4>${z.title}</h4>
   <p>${z.text}</p>
   <strong>🔁 ${z.count}</strong>
   <div>العدد: <span class="cnt">0</span></div>
  `;

  const span=card.querySelector(".cnt");
  const countBtn=document.createElement("button");
  countBtn.textContent="📿";
  countBtn.onclick=()=>{
   if(counter<z.count){ counter++; span.textContent=counter; }
  };

  const doneBtn=document.createElement("button");
  doneBtn.textContent=azkarDone.includes(z.id)?"✔ تم":"⭐ تم الذكر";
  doneBtn.onclick = () => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
        let modal = document.getElementById('azkarLoginModal');
        if (modal) modal.classList.add('show');
        return;
    }
    if (!azkarDone.includes(z.id)) {
        azkarDone.push(z.id);
        let reward = isRamadan() ? 4 : 2;
        addSecondaryToday(reward); 
        saveAzkar();
        doneBtn.textContent = "✔ تم";
        showReward(reward);
        updateStreak();
    }
  };

  card.append(countBtn,doneBtn);
  listContainer.appendChild(card);
  if(azkarDone.includes(z.id)) doneCount++;
 });

 renderProgress(doneCount,items.length);
 listContainer.scrollIntoView({behavior:"smooth"});
}

function renderProgress(done,total){
 const percent = total?Math.round((done/total)*100):0;
 const p=document.createElement("h3");
 p.textContent="📊 إنجاز القسم: "+percent+"%";
 listContainer.prepend(p);
 if(percent===100){ alert("🏆 أحسنت! أنهيت هذا القسم كاملًا"); }
}

function openTasbeeh(){
    listContainer.innerHTML="";
    let count = Number(localStorage.getItem("tasbeehCount")) || 0;
    const card = document.createElement("div");
    card.className = "zekr-card";
    card.innerHTML = `<h3>📿 السبحة الإلكترونية</h3><div id="tasCount" style="font-size:48px;margin:20px 0">${count}</div>`;
   
    const tasbeehBtn = document.createElement("button");
    tasbeehBtn.textContent = "سبّح";
    tasbeehBtn.onclick = () => {
     count++;
     document.getElementById("tasCount").textContent = count;
     localStorage.setItem("tasbeehCount", count);
     syncToServer(); 
    };
   
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "تصفير";
    resetBtn.style.background = "#caa74e";
    resetBtn.onclick = () => {
     count = 0;
     document.getElementById("tasCount").textContent = count;
     localStorage.setItem("tasbeehCount", count);
     syncToServer(); 
    };
   
    card.append(tasbeehBtn, resetBtn);
    listContainer.appendChild(card);
}

function showReward(p){ alert("⭐ مكافأة +" + p + " نقطة"); }

function updateStreak(){
 const today=new Date().toISOString().split("T")[0];
 if(today!==lastDay){
  const y=new Date(); y.setDate(y.getDate()-1);
  const yd=y.toISOString().split("T")[0];
  streak = lastDay===yd ? streak+1 : 1;
  lastDay=today;
  localStorage.setItem("zekrDay",today);
  localStorage.setItem("zekrStreak",streak);
  syncToServer(); 
 }
}

function saveAzkar(){
 localStorage.setItem("azkarDone",JSON.stringify(azkarDone));
 syncToServer(); 
}

function isRamadan(){
 const start = new Date(2026,1,19);
 const end = new Date(start);
 end.setDate(start.getDate()+30);
 const today = new Date();
 return today >= start && today <= end;
}

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

const azkarAuthHTML = `
  <div id="azkarLoginModal" class="auth-modal">
    <div class="auth-modal-card">
      <h2>🔐 الدخول إلزامي</h2>
      <p>لا يمكن احتساب النقاط لملفك الشخصي إلا بعد تسجيل الدخول.</p>
      <button class="auth-modal-btn" onclick="redirectToLogin('azkar.html')">تسجيل الدخول الآن</button>
      <button class="auth-close-btn" onclick="document.getElementById('azkarLoginModal').classList.remove('show')">إلغاء</button>
    </div>
  </div>
`;
document.body.insertAdjacentHTML('beforeend', azkarAuthHTML);

function redirectToLogin(page) {
    localStorage.setItem("returnUrl", page);
    window.location.href = "login.html";
}

// بدء التشغيل
fetchAzkarFromDB();