const token = localStorage.getItem("token");
if (!token) {
    localStorage.setItem("returnUrl", "profile"); 
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const profileCard = document.querySelector('.profile-card');
    
    if (profileCard) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/user/profile", true);
        xhr.setRequestHeader("Authorization", "Bearer " + token);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const userData = JSON.parse(xhr.responseText);
                    const userInfo = document.createElement('div');
                    userInfo.className = 'user-info-card';
                    userInfo.innerHTML = `
                        <div class="user-avatar-circle">👤</div>
                        <div class="user-bio">
                            <h3 id="displayUserName">${userData.username}</h3>
                            <p id="displayUserBio">${userData.bio || "لا يوجد وصف بعد"}</p>
                        </div>
                        <div class="card-buttons" style="position: absolute; top: 15px; left: 15px; display: flex; gap: 8px; flex-direction: column;">
                            <button class="logout-link" style="position: static;" onclick="logoutUser()">تسجيل الخروج</button>
                            <button class="edit-profile-btn" onclick="openEditModal()">✏️ تعديل</button>
                        </div>
                    `;
                    profileCard.prepend(userInfo);

                    // بناء نافذة التعديل مع زر إظهار/إخفاء قسم كلمة المرور
                    const editModalHTML = `
                    <div id="editProfileModal" class="auth-modal">
                        <div class="auth-modal-card" style="max-height: 90vh; overflow-y: auto;">
                            <h2>✏️ تعديل البيانات</h2>
                            <div class="input-group" style="text-align: right; margin-bottom: 15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">الاسم:</label>
                                <input type="text" id="editNameInput" value="${userData.username}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px;">
                            </div>
                            <div class="input-group" style="text-align: right; margin-bottom: 15px;">
                                <label style="display:block; margin-bottom:5px; font-weight:bold;">الوصف:</label>
                                <input type="text" id="editBioInput" value="${userData.bio || ""}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px;">
                            </div>
                            
                            <hr style="border: 0; border-top: 2px dashed #eee; margin: 20px 0;">
                            
                            <button type="button" id="togglePassBtn" onclick="togglePasswordSection()" style="width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #caa74e; background: #fdf6e3; color: #0f5132; font-size: 16px; font-weight: bold; cursor: pointer; margin-bottom: 15px; transition: 0.3s;">🔑 اضغط هنا لتغيير كلمة المرور</button>
                            
                            <div id="passwordSection" style="display: none;">
                                <div class="input-group" style="text-align: right; margin-bottom: 15px;">
                                    <label style="display:block; margin-bottom:5px; font-weight:bold;">كلمة المرور الحالية:</label>
                                    <input type="password" id="editOldPassInput" placeholder="أدخل كلمة المرور الحالية" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px;">
                                </div>
                                <div class="input-group" style="text-align: right; margin-bottom: 15px;">
                                    <label style="display:block; margin-bottom:5px; font-weight:bold;">كلمة المرور الجديدة:</label>
                                    <input type="password" id="editPassInput" placeholder="أدخل كلمة المرور الجديدة" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px;">
                                </div>
                                <div class="input-group" style="text-align: right; margin-bottom: 20px;">
                                    <label style="display:block; margin-bottom:5px; font-weight:bold;">تأكيد كلمة المرور الجديدة:</label>
                                    <input type="password" id="editConfirmPassInput" placeholder="أعد كتابة كلمة المرور الجديدة" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 16px;">
                                </div>
                            </div>
                            
                            <button class="auth-modal-btn" onclick="saveProfile()">حفظ التعديلات</button>
                            <button class="auth-close-btn" onclick="closeEditModal()">إلغاء</button>
                        </div>
                    </div>
                    `;
                    document.body.insertAdjacentHTML('beforeend', editModalHTML);
                } else {
                    logoutUser();
                }
            }
        };
        xhr.send();
    }
});

function openEditModal() { document.getElementById('editProfileModal').classList.add('show'); }
function closeEditModal() { document.getElementById('editProfileModal').classList.remove('show'); }

// دالة إظهار وإخفاء قسم كلمة المرور
function togglePasswordSection() {
    const section = document.getElementById('passwordSection');
    const btn = document.getElementById('togglePassBtn');
    
    if (section.style.display === 'none') {
        section.style.display = 'block';
        btn.innerHTML = '❌ إلغاء تغيير كلمة المرور';
        btn.style.background = '#ffebee';
        btn.style.borderColor = '#ffcdd2';
        btn.style.color = '#c62828';
    } else {
        section.style.display = 'none';
        btn.innerHTML = '🔑 اضغط هنا لتغيير كلمة المرور';
        btn.style.background = '#fdf6e3';
        btn.style.borderColor = '#caa74e';
        btn.style.color = '#0f5132';
        // مسح الخانات لو تراجع عن التغيير
        document.getElementById('editOldPassInput').value = "";
        document.getElementById('editPassInput').value = "";
        document.getElementById('editConfirmPassInput').value = "";
    }
}

function saveProfile() {
    const newName = document.getElementById('editNameInput').value.trim();
    const newBio = document.getElementById('editBioInput').value.trim();
    
    const passSectionVisible = document.getElementById('passwordSection').style.display === 'block';
    const oldPass = document.getElementById('editOldPassInput').value.trim();
    const newPass = document.getElementById('editPassInput').value.trim();
    const confirmPass = document.getElementById('editConfirmPassInput').value.trim();

    // التحقق يتم فقط لو المستخدم فاتح قسم الباسورد
    if (passSectionVisible) {
        if (!oldPass) {
            alert("يجب إدخال كلمة المرور الحالية لتتمكن من التغيير!");
            return;
        }
        if (!newPass) {
            alert("الرجاء إدخال كلمة المرور الجديدة!");
            return;
        }
        if (newPass !== confirmPass) {
            alert("كلمتي المرور الجديدة غير متطابقتين! الرجاء التأكد.");
            return;
        }
        if (newPass.length < 8) {
            alert("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل!");
            return;
        }
    }

    const bodyData = { username: newName, bio: newBio };
    if (passSectionVisible && newPass && oldPass) {
        bodyData.oldPassword = oldPass;
        bodyData.newPassword = newPass;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", "/api/user/profile", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            const data = JSON.parse(xhr.responseText || "{}");
            if (xhr.status === 200) {
                document.getElementById('displayUserName').innerText = data.user.username;
                document.getElementById('displayUserBio').innerText = data.user.bio || "لا يوجد وصف بعد";
                localStorage.setItem("activeUser", data.user.username);
                
                // تفريغ وإخفاء الباسورد بعد الحفظ الناجح
                if(passSectionVisible) togglePasswordSection();
                
                closeEditModal();
                alert("تم حفظ التعديلات بنجاح!");
            } else {
                alert(data.message || "حدث خطأ أثناء الحفظ");
            }
        }
    };
    xhr.send(JSON.stringify(bodyData));
}

function logoutUser() {
    localStorage.clear();
    window.location.href = "login.html";
}

// ----------------------------------------------------
// أكواد التقويم (Calendar) والإحصائيات
// ----------------------------------------------------
const calendar = document.getElementById("ramadanCalendar");
const dailyBox = document.getElementById("dailyPts");
const secondaryBox = document.getElementById("secondaryPts");
const totalBox = document.getElementById("totalPoints");

let dailyTotal = 0; let secondaryTotal = 0;
Object.keys(localStorage).forEach(k=>{
 if(k.startsWith("score-")) dailyTotal += Number(localStorage.getItem(k)) || 0;
 if(k.startsWith("secondary-")) secondaryTotal += Number(localStorage.getItem(k)) || 0;
});

if(dailyBox) dailyBox.innerText = dailyTotal;
if(secondaryBox) secondaryBox.innerText = secondaryTotal;
if(totalBox) totalBox.innerText = dailyTotal + secondaryTotal;

const monthsArabic = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const weekdays = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

let currentDate = new Date();
let currentMonth = currentDate.getMonth() + 1;
let currentYear = currentDate.getFullYear();

if(calendar) {
    calendar.innerHTML = `
    <div class="calendar-wrapper">
     <div class="calendar-header">
       <button class="calendar-btn" id="prevMonth">❮</button>
       <div class="month-center">
        <h2 id="monthName"></h2><p id="hijriMonth"></p>
       </div>
       <button class="calendar-btn" id="nextMonth">❯</button>
     </div>
     <div class="weekdays">${weekdays.map(day=>`<div>${day}</div>`).join("")}</div>
     <div id="calendarGrid" class="calendar-grid"></div>
     <div class="calendar-legend">
       <div class="legend-items">
         <div class="legend"><div class="legend-box legend-done"></div>أيام بها نقاط</div>
         <div class="legend"><div class="legend-box legend-today"></div>اليوم الحالي</div>
         <div class="legend"><div class="legend-box legend-empty"></div>بدون نقاط</div>
       </div>
       <div class="legend-note">⭐ يتم جمع النقاط من: التحديات + الأذكار + الورد + الأحاديث</div>
     </div>
    </div>`;

    const grid = document.getElementById("calendarGrid");
    const monthName = document.getElementById("monthName");
    const hijriMonth = document.getElementById("hijriMonth");

    function loadMonth(month, year){
        const city = localStorage.getItem("city") || "Assiut";
        let country = "Egypt";
        if(["Mecca","Medina"].includes(city)) country = "Saudi Arabia";
        if(city === "Kuwait") country = "Kuwait";

        const xhr = new XMLHttpRequest();
        xhr.open("GET", `https://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=5&month=${month}&year=${year}`, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                grid.innerHTML = "";
                monthName.innerText = `${monthsArabic[month-1]} ${year}`;
                if(data.data.length){
                    hijriMonth.innerText = `${data.data[0].date.hijri.month.ar} ${data.data[0].date.hijri.year} هـ`;
                }
                const today = new Date().toISOString().split("T")[0];
                data.data.forEach(day=>{
                    const greg = day.date.gregorian.date.split("-").reverse().join("-");
                    const score = (Number(localStorage.getItem("score-"+greg))||0) + (Number(localStorage.getItem("secondary-"+greg))||0);
                    let classes = "day" + (score>0?" done":"") + (greg===today?" today":"");
                    grid.innerHTML += `<div class="${classes}"><div class="greg">${Number(greg.split("-")[2])}</div><div class="hijri">${day.date.hijri.day}</div><div class="points">${score} نقطة</div></div>`;
                });
            }
        };
        xhr.send();
    }

    document.getElementById("prevMonth").onclick = ()=>{
     currentMonth--; if(currentMonth < 1){ currentMonth = 12; currentYear--; } loadMonth(currentMonth, currentYear);
    };
    document.getElementById("nextMonth").onclick = ()=>{
     currentMonth++; if(currentMonth > 12){ currentMonth = 1; currentYear++; } loadMonth(currentMonth, currentYear);
    };
    loadMonth(currentMonth, currentYear);
}