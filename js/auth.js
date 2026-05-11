let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    const title = document.getElementById('authTitle');
    const actionBtn = document.getElementById('actionBtn');
    const toggleText = document.getElementById('toggleText');
    const confirmGroup = document.getElementById('confirmGroup');

    if (isLoginMode) {
        title.innerText = 'تسجيل الدخول';
        actionBtn.innerText = 'دخول';
        toggleText.innerText = 'ليس لديك حساب؟ إنشاء حساب جديد';
        confirmGroup.style.display = 'none';
    } else {
        title.innerText = 'إنشاء حساب جديد';
        actionBtn.innerText = 'تسجيل حساب';
        toggleText.innerText = 'لديك حساب بالفعل؟ تسجيل الدخول';
        confirmGroup.style.display = 'block';
    }
}

function handleAuth() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const confirmPassElement = document.getElementById('confirmPassword');
    const confirmPass = confirmPassElement ? confirmPassElement.value.trim() : "";

    if (!user || !pass) {
        alert("يرجى ملء جميع الحقول!");
        return;
    }
    if (pass.length < 8) {
        alert("كلمة المرور يجب أن تكون 8 أحرف على الأقل!");
        return;
    }

    if (!isLoginMode) {
        if (pass !== confirmPass) { alert("كلمتا المرور غير متطابقتين!"); return; }
        
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/auth/register", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                const data = JSON.parse(xhr.responseText || "{}");
                if (xhr.status === 201 || xhr.status === 200) {
                    alert("تم إنشاء حسابك بنجاح! يمكنك تسجيل الدخول الآن.");
                    toggleAuthMode();
                } else {
                    alert("خطأ: " + (data.message || "حدث خطأ غير معروف"));
                }
            }
        };
        xhr.send(JSON.stringify({ username: user, password: pass }));

    } else {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/auth/login", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                const data = JSON.parse(xhr.responseText || "{}");
                if (xhr.status === 200) {
                    localStorage.clear();
                    localStorage.setItem("isLoggedIn", "true");
                    localStorage.setItem("token", data.token); 
                    localStorage.setItem("activeUser", data.username);
                    if(data.bio) localStorage.setItem("userBio", data.bio);

                    const syncXhr = new XMLHttpRequest();
                    syncXhr.open("GET", "/api/user/sync", true);
                    syncXhr.setRequestHeader("Authorization", "Bearer " + data.token);
                    syncXhr.onreadystatechange = function () {
                        if (syncXhr.readyState === 4) {
                            if (syncXhr.status === 200) {
                                const syncData = JSON.parse(syncXhr.responseText);
                                if (syncData.appData) {
                                    Object.keys(syncData.appData).forEach(key => {
                                        localStorage.setItem(key, syncData.appData[key]);
                                    });
                                }
                            }
                            let returnUrl = localStorage.getItem("returnUrl");
                            if (!returnUrl || returnUrl.includes("index")) {
                                window.location.href = "/"; 
                            } else {
                                returnUrl = returnUrl.replace('.html', '');
                                window.location.href = returnUrl;
                            }
                        }
                    };
                    syncXhr.send();

                } else {
                    alert("خطأ: " + (data.message || "بيانات غير صحيحة"));
                }
            }
        };
        xhr.send(JSON.stringify({ username: user, password: pass }));
    }
}