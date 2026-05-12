if ("serviceWorker" in navigator) {
 navigator.serviceWorker.register("/js/sw.js");
}

if ("Notification" in window) {
 Notification.requestPermission();
}

const cities = [
 "Cairo","Giza","Alexandria","Dakahlia","Sharqia","Gharbia","Monufia",
 "Qalyubia","Beheira","Kafr El Sheikh","Damietta","Port Said","Ismailia",
 "Suez","Faiyum","Beni Suef","Minya","Assiut","New Assiut City","Dayrout",
 "Sohag","New Sohag City","Qena","Luxor","Aswan","Red Sea","New Valley",
 "Matrouh","North Sinai","South Sinai",
 "Mecca","Medina","Kuwait"
];

const input = document.getElementById("citySearch");
const listBox = document.getElementById("cityList");
const prayersBox = document.getElementById("prayers");
const timerBox = document.getElementById("timer");
const nextTitle = document.getElementById("nextPrayer");
const adhanAudio = new Audio("/js/adhan.mp3");

document.addEventListener("click",()=>{
 adhanAudio.play().then(()=>adhanAudio.pause()).catch(()=>{});
},{once:true});

let interval;
let lastAdhan = "";

function showCities(arr){
 listBox.innerHTML="";
 if(!arr.length){ listBox.style.display="none"; return; }
 listBox.style.display="block";
 arr.forEach(c=>{
  listBox.innerHTML+=`<div class="city-item">${c}</div>`;
 });
}

input.onclick = ()=> showCities(cities);
input.oninput = ()=>{
 const v=input.value.toLowerCase();
 showCities(cities.filter(c=>c.toLowerCase().includes(v)));
};

listBox.onclick=e=>{
 if(e.target.classList.contains("city-item")){
  input.value=e.target.innerText;
  listBox.style.display="none";
  localStorage.setItem("city",input.value);
  loadPrayers();
 }
};

document.onclick=e=>{
 if(!e.target.closest(".city-wrapper")) listBox.style.display="none";
};

function loadPrayers(){
    clearInterval(interval);
    const city = input.value || "Assiut";
    let country = "Egypt";

    if(["Mecca","Medina"].includes(city)) country = "Saudi Arabia";
    if(city === "Kuwait") country = "Kuwait";

    let url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=5`;
    if(city === "New Assiut City"){
        url = "https://api.aladhan.com/v1/timings?latitude=27.18&longitude=31.17&method=5";
    }

    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const t = data.data.timings;
            const prayers = [
                ["الفجر", t.Fajr], ["الشروق", t.Sunrise], ["الظهر", t.Dhuhr],
                ["العصر", t.Asr], ["المغرب", t.Maghrib], ["العشاء", t.Isha]
            ];

            prayersBox.innerHTML = "";
            prayers.forEach(p => {
                prayersBox.innerHTML += `
                <div class="row" id="${p[0]}">
                    <span>${p[0]}</span>
                    <span>${p[1]}</span>
                </div>`;
            });

            startTimer(prayers);
            checkAdhan(prayers);
        }
    };
    xhr.send();
}

function startTimer(prayers){
 function tick(){
  const now=new Date();
  let next,time;

  prayers.forEach(p=>{
   const [h,m]=p[1].split(":");
   const d=new Date();
   d.setHours(h,m,0,0);
   if(d>now && (!time||d<time)){
    time=d; next=p[0];
   }
  });

  if(!time){
   const [h,m]=prayers[0][1].split(":");
   time=new Date(); time.setDate(time.getDate()+1);
   time.setHours(h,m,0,0); next=prayers[0][0];
  }

  const diff=Math.floor((time-now)/1000);
  const hh=String(Math.floor(diff/3600)).padStart(2,"0");
  const mm=String(Math.floor(diff%3600/60)).padStart(2,"0");
  const ss=String(diff%60).padStart(2,"0");

  timerBox.innerText=`${hh}:${mm}:${ss}`;
  nextTitle.innerText=`متبقي على ${next}`;

  document.querySelectorAll(".row").forEach(r=>r.classList.remove("next"));
  document.getElementById(next)?.classList.add("next");
 }
 tick();
 interval=setInterval(tick,1000);
}

function checkAdhan(prayers){
 setInterval(()=>{
  const now=new Date();
  const current = String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");

  prayers.forEach(p=>{
   if(p[1]===current && lastAdhan!==current){
    adhanAudio.play();
    if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(reg=>{
         reg.showNotification("🕌 وقت الصلاة",{ body:"حان الآن وقت " + p[0] });
        });
    }
    lastAdhan=current;
   }
  });
 },1000);
}

input.value=localStorage.getItem("city") || "Assiut";
loadPrayers();
