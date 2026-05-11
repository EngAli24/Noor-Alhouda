const content = document.getElementById("content");
const stats = document.getElementById("stats");

let mode = "hadith";
let index = 0;
let HADITH_LIBRARY = []; 
let loadedAyahs = JSON.parse(localStorage.getItem("loadedAyahs"));
if(!Array.isArray(loadedAyahs)) loadedAyahs = [];
let ayahPointer = Number(localStorage.getItem("ayahPointer")) || 1;

let fav = JSON.parse(localStorage.getItem("fav"));
if(!Array.isArray(fav)) fav = [];

let read = JSON.parse(localStorage.getItem("read"));
if(!Array.isArray(read)) read = [];

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

function save(){
 localStorage.setItem("fav", JSON.stringify(fav));
 localStorage.setItem("read", JSON.stringify(read));
 localStorage.setItem("loadedAyahs", JSON.stringify(loadedAyahs));
 localStorage.setItem("ayahPointer", ayahPointer);
 if(stats) stats.innerText = `📖 ${read.length} `;
 syncToServer(); 
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

function createCard(id, text, more, source){
 const div = document.createElement("div");
 div.className="item";
 div.innerHTML=`
  <strong>${text}</strong>
  <div class="more" style="display:none;margin-top:8px;color:#0f5132">${more}</div>
  ${source?`<small>${source}</small>`:""}
 `;
 const actions=document.createElement("div");
 actions.className="actions";
 const moreBtn=document.createElement("button");
 moreBtn.textContent="📖 قراءة المزيد";
 moreBtn.onclick=()=>{
  const m=div.querySelector(".more");
  m.style.display=m.style.display==="block"?"none":"block";
 };
 const favBtn = document.createElement("button");
 favBtn.textContent = fav.includes(id) ? "💛" : "❤️";
 favBtn.onclick = () => {
  if(!fav.includes(id)) fav.push(id);
  else fav = fav.filter(x => x !== id);
  save();
  if(mode === "fav") showFav();
  if(mode === "read") showRead();
 };
 const readBtn = document.createElement("button");
 readBtn.textContent = read.includes(id) ? "✔ تم" : "✔ تمت القراءة";
 readBtn.onclick = () => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
        showLoginModal(); return;
    }
    if (!read.includes(id)) {
        read.push(id);
        addSecondaryToday(3); 
        save();
        alert("⭐ مكافأة +3 نقاط"); 
    }
    readBtn.textContent = "✔ تم";
};
 actions.append(moreBtn,favBtn,readBtn);
 div.appendChild(actions);
 content.appendChild(div);
}

// جلب الأحاديث من قاعدة البيانات بالـ AJAX
function fetchHadithsFromDB() {
    content.innerHTML = "<p style='text-align:center;'>جاري تحميل الأحاديث...</p>";
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/data/hadiths", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            HADITH_LIBRARY = JSON.parse(xhr.responseText);
            showHadith(); // عرض الأحاديث بعد ما وصلت
        }
    };
    xhr.send();
}

function showHadith(){
 mode="hadith"; content.innerHTML=""; index=0; loadHadith();
}

function loadHadith(){
 if(HADITH_LIBRARY.length === 0) return;
 HADITH_LIBRARY.slice(index,index+4).forEach(h=>{
  createCard(h.id,h.text,"📖 "+h.explanation,"📚 "+h.source);
 });
 index+=4;
}

let isLoading = false;
function showTafsir(){
 mode="tafsir"; content.innerHTML="";
 loadedAyahs.forEach(a=>{ createCard(a.id,a.text,a.tafsir,""); });
}

function loadTafsir(){
    if(isLoading) return;   
    isLoading = true;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://api.alquran.cloud/v1/ayah/${ayahPointer}/editions/quran-uthmani,ar.muyassar`, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const d = JSON.parse(xhr.responseText);
            const newId = "ayah-"+ayahPointer;
            if(!loadedAyahs.some(a=>a.id===newId)){
                const obj={ id:newId, text:d.data[0].text, tafsir:d.data[1].text };
                loadedAyahs.push(obj);
                createCard(obj.id, obj.text, obj.tafsir, "");
                ayahPointer++; save();
            }
            isLoading = false;
        }
    };
    xhr.send();
}

function loadMore(){
 if(mode==="hadith") loadHadith();
 if(mode==="tafsir") loadTafsir();
}

window.addEventListener("scroll",()=>{
 if(mode==="hadith"||mode==="tafsir"){
  if(window.innerHeight+window.scrollY>=document.body.offsetHeight-120) loadMore();
 }
});

function showFav(){
 mode="fav";
 content.innerHTML="<h3>📜 الأحاديث المفضلة</h3>";
 HADITH_LIBRARY.filter(h=>fav.includes(h.id)).forEach(h=>createCard(h.id,h.text,"📖 "+h.explanation,"📚 "+h.source));
 content.innerHTML+="<h3>📖 آيات مفضلة</h3>";
 loadedAyahs.filter(a=>fav.includes(a.id)).forEach(a=>createCard(a.id,a.text,a.tafsir,""));
}

const inputSearch = document.getElementById("searchInput");
function normalizeArabic(text){
 return text.replace(/[ًٌٍَُِّْ]/g,"").replace(/أ|إ|آ/g,"ا").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/ة/g,"ه").toLowerCase();
}
function smartMatch(text, query){
 return query.split(" ").every(w => text.includes(w));
}
if(inputSearch) inputSearch.addEventListener("input", smartSearch);

function smartSearch(){
    const q = normalizeArabic(inputSearch.value.trim());
    if(q.length < 2){ content.innerHTML=""; showHadith(); return; }
    content.innerHTML="";
    
    HADITH_LIBRARY.forEach(h=>{
        if(smartMatch(normalizeArabic(h.text), q)){
            createCard("s-"+h.id, h.text, "📖 "+h.explanation, "📚 "+h.source);
        }
    });

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://api.alquran.cloud/v1/search/${q}/all/ar.muyassar`, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if(data.data && data.data.matches) {
                data.data.matches.slice(0,8).forEach(a=>{ createCard("q-"+a.number, a.text, a.text, ""); });
            }
        }
    };
    xhr.send();
}

function showRead(){
 mode="read";
 content.innerHTML="<h3>📜 الأحاديث المقروءة</h3>";
 HADITH_LIBRARY.filter(h=>read.includes(h.id)).forEach(h=>createCard(h.id,h.text,"📖 "+h.explanation,"📚 "+h.source));
 content.innerHTML+="<h3>📖 آيات مقروءة</h3>";
 loadedAyahs.filter(a=>read.includes(a.id)).forEach(a=>createCard(a.id,a.text,a.tafsir,""));
}

save(); 

function showLoginModal() {
    let modal = document.getElementById('azkarLoginModal');
    if (!modal) {
        const html = `
          <div id="azkarLoginModal" class="auth-modal show">
            <div class="auth-modal-card">
              <h2>🔐 الدخول إلزامي</h2>
              <p>لا يمكن احتساب النقاط لملفك الشخصي إلا بعد تسجيل الدخول.</p>
              <button class="auth-modal-btn" onclick="redirectToLogin('ramadan.html')">تسجيل الدخول الآن</button>
              <button class="auth-close-btn" onclick="document.getElementById('azkarLoginModal').classList.remove('show')">إلغاء</button>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    } else {
        modal.classList.add('show');
    }
}

function redirectToLogin(page) {
    localStorage.setItem("returnUrl", page);
    window.location.href = "login.html";
}

fetchHadithsFromDB();