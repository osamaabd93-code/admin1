import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAkQpzDCLuL_IXuyIqZrAl4B__BtvieGmI",
    authDomain: "iook-92aee.firebaseapp.com",
    projectId: "iook-92aee",
    storageBucket: "iook-92aee.firebasestorage.app",
    messagingSenderId: "92508471614",
    appId: "1:92508471614:web:3d2a192bc0182ff436ac6f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let appData = {
    drivers: [], mandoubs: [], buses: [], accountants: [], expenseTypes: [], busExpenseOptions: [],
    users: [], savedTrips: [], savedTripsInfo: [], tasks: [], returnInfos: [],
    busFunds: {}, userExpenses: [], userIncomes: [], userBusExpenses: [], finances: []
};

const $ = (id) => document.getElementById(id);

window.showCustomAlert = (message) => {
    const container = $("custom-alert-container");
    if (!container) return;
    const alertDiv = document.createElement("div");
    alertDiv.className = "custom-alert";
    alertDiv.textContent = message;
    container.appendChild(alertDiv);
    setTimeout(() => { if (container.contains(alertDiv)) container.removeChild(alertDiv); }, 3000);
};

// دالة تصدير إكسل مركزية للمصفوفات
window.exportArrayToExcel = (arrayName, filename) => {
    const data = appData[arrayName] || [];
    if (data.length === 0) { showCustomAlert("لا توجد بيانات للتصدير"); return; }
    
    // إزالة حقول الصور لعدم إفساد ملف الـ CSV
    const keys = Object.keys(data[0]).filter(k => !k.toLowerCase().includes('base64'));
    let csv = "\uFEFF" + keys.join(",") + "\n";
    data.forEach(item => {
        csv += keys.map(k => `"${String(item[k] || "").replace(/"/g, '""')}"`).join(",") + "\n";
    });
    
    const link = document.createElement("a");
    link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
    link.download = filename + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

async function compressImageAndConvertToBase64(file) {
    return new Promise((resolve, reject) => {
        if (!file) { resolve(""); return; }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width, height = img.height;
                if (width > height) { if (width > 800) { height *= 800 / width; width = 800; } }
                else { if (height > 800) { width *= 800 / height; height = 800; } }
                canvas.width = width; canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.6));
            };
        };
        reader.onerror = reject;
    });
}

async function saveToDB() {
    try { await setDoc(doc(db, "system", "data"), appData); }
    catch (e) { console.error("خطأ في الحفظ:", e); }
}

function listenToDB() {
    onSnapshot(doc(db, "system", "data"), (docSnap) => {
        if (docSnap.exists()) {
            const incoming = docSnap.data();
            appData = {
                drivers: [], mandoubs: [], buses: [], accountants: [], expenseTypes: [], busExpenseOptions: [],
                users: [], savedTrips: [], savedTripsInfo: [], tasks: [], returnInfos: [],
                busFunds: {}, userExpenses: [], userIncomes: [], userBusExpenses: [], finances: [],
                ...incoming
            };
            refreshAllUI();
        } else {
            saveToDB();
        }
    });
}

function refreshAllUI() {
    populateSelects();
    generateBusFunds(); // تحديث الصناديق لتصبح ديناميكية
    renderLists();
    renderTrips();
    renderTripInfos();
    renderTasks();
    renderReturns();
    if(window.renderFinances) window.renderFinances(); // تحديث قائمة المالية
}

document.addEventListener("DOMContentLoaded", () => {
    setupLoginSystem();
    setupNavigation();
    setupCalculationsAndInteractions();
    setupSettingsSystem();
    setupTripSystem();
    setupTripInfoSystem();
    setupTaskSystem();
    setupReturnSystem();
    setupSaveButtons();
    setupReportsSystem();
    setupImageCompressors();
    setupImageModal();
    listenToDB();
});

function setupImageCompressors() {
    const attachCompressor = (inputId, hiddenId) => {
        const input = $(inputId), hidden = $(hiddenId);
        if (input && hidden) {
            input.addEventListener("change", async (e) => hidden.value = await compressImageAndConvertToBase64(e.target.files[0]));
        }
    };
    attachCompressor("trip-file", "trip-file-base64");
}

function setupImageModal() {
    const modal = $("image-modal");
    const modalImg = $("modal-img");
    window.openImage = (src) => { modal.style.display = "block"; modalImg.src = src; };
    document.getElementsByClassName("close-modal")[0].onclick = () => modal.style.display = "none";
    window.onclick = (event) => { if (event.target === modal) modal.style.display = "none"; };
}

function setupLoginSystem() {
    $("btn-login-admin").addEventListener("click", () => {
        if ($("admin-pass-input").value === "1100") {
            $("login-screen").classList.add("hidden");
            $("admin-app").classList.remove("hidden");
            $("admin-pass-input").value = "";
        } else {
            showCustomAlert("كلمة المرور غير صحيحة");
        }
    });

    document.querySelectorAll(".btn-logout").forEach(btn => {
        btn.addEventListener("click", () => {
            $("admin-app").classList.add("hidden");
            $("login-screen").classList.remove("hidden");
        });
    });
}

function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const role = item.getAttribute("data-role");
            const targetId = item.getAttribute("data-target");
            const parentApp = document.getElementById(`${role}-app`);
            parentApp.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
            parentApp.querySelectorAll(".nav-item").forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            $(targetId).classList.add("active");
        });
    });
}

function populateSelects() {
    const driverList = $("driver-list"), mandoubList = $("mandoub-list");
    const busSelect = $("bus-select"), financeBusType = $("finance-bus-type");
    const financeDriverName = $("finance-driver-name"), financeMandoubName = $("finance-mandoub-name");
    const taskTripName = $("task-trip-name"), returnTripName = $("return-trip-name");

    if (driverList) driverList.innerHTML = (appData.drivers || []).map(n => `<option value="${n}">`).join("");
    if (mandoubList) mandoubList.innerHTML = (appData.mandoubs || []).map(n => `<option value="${n}">`).join("");

    const busHtml = (appData.buses || []).map(n => `<option value="${n}">${n}</option>`).join("");
    if (busSelect) busSelect.innerHTML = `<option value="">اختر الباص</option>${busHtml}`;
    if (financeBusType) financeBusType.innerHTML = `<option value="">اختر الباص</option>${busHtml}`;

    const driverHtml = (appData.drivers || []).map(n => `<option value="${n}">${n}</option>`).join("");
    const mandoubHtml = (appData.mandoubs || []).map(n => `<option value="${n}">${n}</option>`).join("");
    if (financeDriverName) financeDriverName.innerHTML = `<option value="">اختر السائق</option>${driverHtml}`;
    if (financeMandoubName) financeMandoubName.innerHTML = `<option value="">اختر المندوب</option>${mandoubHtml}`;

    const tripHtml = (appData.savedTrips || []).map(t => `<option value="${t.name}">${t.name}</option>`).join("");
    if (taskTripName) taskTripName.innerHTML = `<option value="">اختر الرحلة</option>${tripHtml}`;
    if (returnTripName) returnTripName.innerHTML = `<option value="">اختر الرحلة</option>${tripHtml}`;

    updateTaskPersonOptions();
}

function updateTaskPersonOptions() {
    const role = $("task-role")?.value || "سائق";
    const select = $("task-person-name");
    if (!select) return;
    const arr = role === "مندوب" ? (appData.mandoubs || []) : (appData.drivers || []);
    select.innerHTML = `<option value="">اختر الاسم</option>` + arr.map(n => `<option value="${n}">${n}</option>`).join("");
}

// برمجة الصناديق ديناميكياً للعمل التلقائي بناءً على المدخلات
function generateBusFunds() {
    const grid = $("buses-funds-grid");
    if (!grid) return;
    
    let dynamicBusFunds = {};
    (appData.buses || []).forEach(bus => dynamicBusFunds[bus] = { in: 0, out: 0, trans: 0 });
    
    let totalPublicTransIn = 0;
    let totalPublicTransOut = 0;
    
    (appData.finances || []).forEach(f => {
        if (f.busType) {
            if (!dynamicBusFunds[f.busType]) dynamicBusFunds[f.busType] = { in: 0, out: 0, trans: 0 };
            dynamicBusFunds[f.busType].in += Number(f.busFare) || 0;
            totalPublicTransIn += Number(f.busFare) || 0;
        }
    });
    
    (appData.userBusExpenses || []).forEach(e => {
        if (e.car) {
            if (!dynamicBusFunds[e.car]) dynamicBusFunds[e.car] = { in: 0, out: 0, trans: 0 };
            dynamicBusFunds[e.car].out += Number(e.amount) || 0;
            totalPublicTransOut += Number(e.amount) || 0;
        }
    });

    grid.innerHTML = (appData.buses || []).map(bus => {
        const fund = dynamicBusFunds[bus] || { in: 0, out: 0, trans: 0 };
        return `
            <div class="stat-card glass-panel">
                <i class="fas fa-bus" style="color: #60a5fa; font-size: 1.5rem;"></i>
                <h4 class="glass-text" style="font-size: 0.9rem; margin: 5px 0;">${bus}</h4>
                <div class="fund-details glass-inner"><span>و: ${fund.in}</span> | <span>ص: ${fund.out}</span></div>
            </div>`;
    }).join("");
    
    let umrahIn = 0, umrahOut = 0;
    (appData.savedTripsInfo || []).forEach(info => {
        umrahIn += Number(info.val26) || 0; 
        umrahOut += Number(info.val27) || 0; 
    });
    
    if ($("public-trans-in")) $("public-trans-in").textContent = totalPublicTransIn;
    if ($("public-trans-out")) $("public-trans-out").textContent = totalPublicTransOut;
    
    if ($("umrah-trans-in")) $("umrah-trans-in").textContent = umrahIn;
    if ($("umrah-trans-out")) $("umrah-trans-out").textContent = umrahOut;
    
    let profitIn = totalPublicTransIn + umrahIn;
    (appData.userIncomes || []).forEach(i => profitIn += Number(i.amount) || 0);

    let profitOut = totalPublicTransOut + umrahOut;
    (appData.userExpenses || []).forEach(e => profitOut += Number(e.amount) || 0);

    if ($("profit-in")) $("profit-in").textContent = profitIn;
    if ($("profit-out")) $("profit-out").textContent = profitOut;
}

function setupCalculationsAndInteractions() {
    const calc = (totalId, paidId, remId) => {
        const t = $(totalId), p = $(paidId), r = $(remId);
        if (t && p && r) {
            const fn = () => { r.value = Math.max((Number(t.value) || 0) - (Number(p.value) || 0), 0); };
            t.addEventListener("input", fn);
            p.addEventListener("input", fn);
        }
    };
    calc("driver-total", "driver-paid", "driver-rem");
    calc("man-total", "man-paid", "man-rem");
    $("task-role")?.addEventListener("change", updateTaskPersonOptions);
}

function renderLists() {
    const makeList = (arr, listId, delFn, editFn) => {
        const list = $(listId);
        if (!list) return;
        list.innerHTML = (appData[arr] || []).map((n, i) => `
            <li style="justify-content: space-between;">
                <span>${arr === "users" ? `${n.name} | كلمة السر: ${n.pass}` : n}</span>
                <div>
                    <button onclick="${editFn}(${i})" class="glass-btn" style="padding:5px 10px; cursor:pointer; margin-left:5px;">تعديل</button>
                    <button onclick="${delFn}(${i})" class="glass-btn" style="background:rgba(255,0,0,0.5) !important; padding:5px 10px; cursor:pointer;">حذف</button>
                </div>
            </li>`).join("");
    };
    makeList("mandoubs", "mandoubs-settings-list", "delMandoub", "editMandoub");
    makeList("drivers", "drivers-settings-list", "delDriver", "editDriver");
    makeList("buses", "bus-settings-list", "delBus", "editBus");
    makeList("expenseTypes", "exp-types-list", "delExp", "editExp");
    makeList("busExpenseOptions", "bus-opts-list", "delBusOpt", "editBusOpt");
    makeList("users", "users-list", "delUser", "editUser");
}

function setupSettingsSystem() {
    const pushValue = (inputId, arrName) => {
        const val = $(inputId).value.trim();
        if (!val) return;
        if (!appData[arrName]) appData[arrName] = [];
        appData[arrName].push(val);
        $(inputId).value = "";
        saveToDB();
        showCustomAlert("تم الحفظ بنجاح");
    };

    $("btn-add-mandoub").addEventListener("click", () => pushValue("new-mandoub-name-input", "mandoubs"));
    $("btn-add-driver").addEventListener("click", () => pushValue("new-driver-name-input", "drivers"));
    $("btn-add-bus").addEventListener("click", () => pushValue("new-bus-input", "buses"));
    $("btn-add-exp-type").addEventListener("click", () => pushValue("new-exp-type-input", "expenseTypes"));
    $("btn-add-bus-opt").addEventListener("click", () => pushValue("new-bus-opt-input", "busExpenseOptions"));

    $("btn-save-new-user").addEventListener("click", () => {
        const name = $("new-user-name").value.trim(), pass = $("new-user-pass").value.trim();
        if (name && pass) {
            if (!appData.users) appData.users = [];
            appData.users.push({ name, pass });
            $("new-user-name").value = "";
            $("new-user-pass").value = "";
            saveToDB();
            showCustomAlert("تم حفظ المستخدم بنجاح");
        }
    });

    const bindEditDel = (arr) => ({
        del: (i) => { appData[arr].splice(i, 1); saveToDB(); },
        edit: (i) => {
            const n = prompt("تعديل", appData[arr][i]);
            if (n) { appData[arr][i] = n; saveToDB(); }
        }
    });

    const binded = { e: bindEditDel("expenseTypes"), bO: bindEditDel("busExpenseOptions"), d: bindEditDel("drivers"), m: bindEditDel("mandoubs"), b: bindEditDel("buses") };
    window.delExp = binded.e.del; window.editExp = binded.e.edit;
    window.delBusOpt = binded.bO.del; window.editBusOpt = binded.bO.edit;
    window.delDriver = binded.d.del; window.editDriver = binded.d.edit;
    window.delMandoub = binded.m.del; window.editMandoub = binded.m.edit;
    window.delBus = binded.b.del; window.editBus = binded.b.edit;
    window.delUser = (i) => { appData.users.splice(i, 1); saveToDB(); };
    window.editUser = (i) => {
        const nName = prompt("تعديل الاسم", appData.users[i].name);
        const nPass = prompt("تعديل كلمة السر", appData.users[i].pass);
        if (nName && nPass) {
            appData.users[i].name = nName;
            appData.users[i].pass = nPass;
            saveToDB();
        }
    };
}

function setupTripSystem() {
    window.renderTrips = () => {
        const list = $("saved-trips-list");
        if (!list) return;
        list.innerHTML = (appData.savedTrips || []).map((t, i) => `
            <li style="justify-content: space-between; flex-wrap: wrap;">
                <span>${t.name || "-"} | رقم: ${t.tripNumber || "-"} | المندوب: ${t.mandoub || "-"} | السائق: ${t.driver || "-"} | الباص: ${t.bus || "-"} | قبل الرحلة: ${t.kmBefore || 0} كم</span>
                <div>
                    ${t.imgBase64 ? `<img src="${t.imgBase64}" class="clickable-image" onclick="openImage('${t.imgBase64}')" style="margin-left: 10px;">` : ""}
                    <button onclick="editTrip(${i})" class="glass-btn" style="padding:5px 10px; cursor:pointer; margin-right:5px;">تعديل</button>
                    <button onclick="deleteTrip(${i})" class="glass-btn" style="background:rgba(255,0,0,0.5) !important; padding:5px 10px; cursor:pointer; margin-right:5px;">حذف</button>
                </div>
            </li>`).join("");
    };

    $("btn-save-trip").addEventListener("click", () => {
        const trip = {
            name: $("trip-name").value,
            tripNumber: $("trip-number").value,
            date: $("trip-date").value,
            days: $("trip-days").value,
            mandoub: $("mandoub-select").value,
            driver: $("driver-select").value,
            driver2: $("driver2-select").value,
            bus: $("bus-select").value,
            busCount: $("bus-count").value,
            kmBefore: $("trip-km-before").value,
            notes: $("trip-notes").value,
            imgBase64: $("trip-file-base64").value,
            status: "معلقة"
        };
        if (!appData.savedTrips) appData.savedTrips = [];
        if (window.editTripIndex != null) {
            appData.savedTrips[window.editTripIndex] = { ...appData.savedTrips[window.editTripIndex], ...trip };
            window.editTripIndex = null;
            $("btn-save-trip").textContent = "حفظ وإنشاء الرحلة";
        } else {
            appData.savedTrips.push(trip);
        }
        $("trip-form").reset();
        $("trip-file-base64").value = "";
        saveToDB();
        showCustomAlert("تم حفظ الرحلة بنجاح");
    });

    window.deleteTrip = (i) => {
        if (confirm("هل أنت متأكد من حذف الرحلة؟")) {
            appData.savedTrips.splice(i, 1);
            saveToDB();
        }
    };

    window.editTrip = (i) => {
        const t = appData.savedTrips[i];
        $("trip-name").value = t.name || "";
        $("trip-number").value = t.tripNumber || "";
        $("trip-date").value = t.date || "";
        $("trip-days").value = t.days || "";
        $("mandoub-select").value = t.mandoub || "";
        $("driver-select").value = t.driver || "";
        $("driver2-select").value = t.driver2 || "";
        $("bus-select").value = t.bus || "";
        $("bus-count").value = t.busCount || "";
        $("trip-km-before").value = t.kmBefore || "";
        $("trip-notes").value = t.notes || "";
        window.editTripIndex = i;
        $("btn-save-trip").textContent = "تحديث الرحلة";
    };
}

function setupTripInfoSystem() {
    window.renderTripInfos = () => {
        const list = $("saved-trip-infos-list");
        if (!list) return;
        list.innerHTML = (appData.savedTripsInfo || []).map((info, i) => `
            <li style="justify-content: space-between; flex-wrap: wrap;">
                <span>معاملة ${i + 1} | المورد: ${info.val15 || "-"} | الانطلاقية: ${info.val16 || "-"} | الوجهة: ${info.val17 || "-"}</span>
                <div>
                    <button onclick="editTripInfo(${i})" class="glass-btn" style="padding:5px 10px; cursor:pointer; margin-right:5px;">تعديل</button>
                    <button onclick="deleteTripInfo(${i})" class="glass-btn" style="background:rgba(255,0,0,0.5) !important; padding:5px 10px; cursor:pointer; margin-right:5px;">حذف</button>
                </div>
            </li>`).join("");
    };

    $("btn-save-trip-info").addEventListener("click", () => {
        const info = { currency: $("ti-currency").value };
        for (let i = 1; i <= 27; i++) info[`val${i}`] = $(`ti-${i}`) ? $(`ti-${i}`).value : "";
        info.valnew1 = $("ti-new1").value;
        info.valnew2 = $("ti-new2").value;
        if (!appData.savedTripsInfo) appData.savedTripsInfo = [];
        if (window.editTripInfoIndex != null) {
            appData.savedTripsInfo[window.editTripInfoIndex] = info;
            window.editTripInfoIndex = null;
            $("btn-save-trip-info").textContent = "حفظ المعلومات";
        } else {
            appData.savedTripsInfo.push(info);
        }
        $("trip-info-form").reset();
        saveToDB();
        showCustomAlert("تم حفظ المعلومات بنجاح");
    });

    window.deleteTripInfo = (i) => {
        if (confirm("هل أنت متأكد من حذف المعلومات؟")) {
            appData.savedTripsInfo.splice(i, 1);
            saveToDB();
        }
    };

    window.editTripInfo = (i) => {
        const info = appData.savedTripsInfo[i];
        $("ti-currency").value = info.currency || "دينار";
        for (let j = 1; j <= 27; j++) if ($(`ti-${j}`)) $(`ti-${j}`).value = info[`val${j}`] || "";
        $("ti-new1").value = info.valnew1 || "";
        $("ti-new2").value = info.valnew2 || "";
        window.editTripInfoIndex = i;
        $("btn-save-trip-info").textContent = "تحديث المعلومات";
    };
}

function setupTaskSystem() {
    $("btn-save-task").addEventListener("click", () => {
        const task = {
            tripName: $("task-trip-name").value,
            role: $("task-role").value,
            personName: $("task-person-name").value,
            task: $("task-text").value,
            status: $("task-status").value,
            notes: $("task-notes").value,
            createdAt: new Date().toISOString()
        };
        if (!appData.tasks) appData.tasks = [];
        if (window.editTaskIndex != null) {
            appData.tasks[window.editTaskIndex] = task;
            window.editTaskIndex = null;
            $("btn-save-task").textContent = "حفظ المهمة";
        } else {
            appData.tasks.push(task);
        }
        $("tasks-form").reset();
        updateTaskPersonOptions();
        saveToDB();
        showCustomAlert("تم حفظ المهمة بنجاح");
    });

    window.renderTasks = () => {
        const list = $("tasks-list");
        if (!list) return;
        list.innerHTML = (appData.tasks || []).map((t, i) => `
            <li style="justify-content: space-between; flex-wrap: wrap;">
                <span>${t.tripName || "-"} | ${t.role || "-"} | ${t.personName || "-"} | ${t.task || "-"} | ${t.status || "-"}</span>
                <div>
                    <button onclick="editTask(${i})" class="glass-btn" style="padding:5px 10px; cursor:pointer; margin-right:5px;">تعديل</button>
                    <button onclick="deleteTask(${i})" class="glass-btn" style="background:rgba(255,0,0,0.5) !important; padding:5px 10px; cursor:pointer;">حذف</button>
                </div>
            </li>`).join("");
    };

    window.editTask = (i) => {
        const t = appData.tasks[i];
        $("task-trip-name").value = t.tripName || "";
        $("task-role").value = t.role || "سائق";
        updateTaskPersonOptions();
        $("task-person-name").value = t.personName || "";
        $("task-text").value = t.task || "";
        $("task-status").value = t.status || "جديدة";
        $("task-notes").value = t.notes || "";
        window.editTaskIndex = i;
        $("btn-save-task").textContent = "تحديث المهمة";
    };

    window.deleteTask = (i) => {
        if (confirm("هل أنت متأكد من حذف المهمة؟")) {
            appData.tasks.splice(i, 1);
            saveToDB();
        }
    };
}

function setupReturnSystem() {
    $("btn-save-return").addEventListener("click", () => {
        const item = {
            tripName: $("return-trip-name").value,
            currency: $("return-currency").value,
            mandoubBonus: $("return-mandoub-bonus").value,
            mandoubDiscount: $("return-mandoub-discount").value,
            driverBonus: $("return-driver-bonus").value,
            driverDiscount: $("return-driver-discount").value,
            netKm: $("return-net-km").value,
            date: new Date().toISOString()
        };
        if (!appData.returnInfos) appData.returnInfos = [];
        if (window.editReturnIndex != null) {
            appData.returnInfos[window.editReturnIndex] = item;
            window.editReturnIndex = null;
            $("btn-save-return").textContent = "حفظ المعلومات";
        } else {
            appData.returnInfos.push(item);
        }
        $("return-form").reset();
        saveToDB();
        showCustomAlert("تم حفظ معلومات بعد العودة");
    });

    window.renderReturns = () => {
        const list = $("return-list");
        if (!list) return;
        list.innerHTML = (appData.returnInfos || []).map((r, i) => `
            <li style="justify-content: space-between; flex-wrap: wrap;">
                <span>${r.tripName || "-"} | المندوب: ${r.mandoubBonus || 0}/${r.mandoubDiscount || 0} | السائق: ${r.driverBonus || 0}/${r.driverDiscount || 0} | صافي كم: ${r.netKm || "-"}</span>
                <div>
                    <button onclick="editReturn(${i})" class="glass-btn" style="padding:5px 10px; cursor:pointer; margin-right:5px;">تعديل</button>
                    <button onclick="deleteReturn(${i})" class="glass-btn" style="background:rgba(255,0,0,0.5) !important; padding:5px 10px; cursor:pointer;">حذف</button>
                </div>
            </li>`).join("");
    };

    window.editReturn = (i) => {
        const r = appData.returnInfos[i];
        $("return-trip-name").value = r.tripName || "";
        $("return-currency").value = r.currency || "دينار";
        $("return-mandoub-bonus").value = r.mandoubBonus || "";
        $("return-mandoub-discount").value = r.mandoubDiscount || "";
        $("return-driver-bonus").value = r.driverBonus || "";
        $("return-driver-discount").value = r.driverDiscount || "";
        if ($("return-net-km")) $("return-net-km").value = r.netKm || "";
        window.editReturnIndex = i;
        $("btn-save-return").textContent = "تحديث المعلومات";
    };

    window.deleteReturn = (i) => {
        if (confirm("هل أنت متأكد من حذف السجل؟")) {
            appData.returnInfos.splice(i, 1);
            saveToDB();
        }
    };
}

function setupSaveButtons() {
    // وظائف قائمة عرض المالية (تعديل وحذف)
    window.renderFinances = () => {
        const list = $("finance-list");
        if (!list) return;
        list.innerHTML = (appData.finances || []).map((f, i) => `
            <li style="justify-content: space-between; flex-wrap: wrap;">
                <span>${(f.date || "").split("T")[0] || "-"} | باص: ${f.busType || "-"} | سائق: ${f.driverName || "-"} | مندوب: ${f.mandoubName || "-"}</span>
                <div>
                    <button onclick="editFinance(${i})" class="glass-btn" style="padding:5px 10px; cursor:pointer; margin-right:5px;">تعديل</button>
                    <button onclick="deleteFinance(${i})" class="glass-btn" style="background:rgba(255,0,0,0.5) !important; padding:5px 10px; cursor:pointer;">حذف</button>
                </div>
            </li>`).join("");
    };

    window.editFinance = (i) => {
        const f = appData.finances[i];
        $("finance-currency").value = f.currency || "دينار";
        $("finance-bus-type").value = f.busType || "";
        $("finance-bus-fare").value = f.busFare || "";
        $("finance-driver-name").value = f.driverName || "";
        $("finance-driver-debt").value = f.driverDebt || "";
        $("finance-driver-advance").value = f.driverAdvance || "";
        $("finance-driver-loan-iqd").value = f.driverLoanIQD || "";
        $("finance-driver-loan-usd").value = f.driverLoanUSD || "";
        $("finance-driver-loan-sar").value = f.driverLoanSAR || "";
        $("driver-total").value = f.driverTotal || "";
        $("driver-paid").value = f.driverPaid || "";
        $("driver-rem").value = f.driverRem || "";
        $("finance-driver-eval").value = f.driverEval || "ممتاز";
        $("finance-mandoub-name").value = f.mandoubName || "";
        $("finance-mandoub-advance").value = f.mandoubAdvance || "";
        $("finance-mandoub-loan-iqd").value = f.mandoubLoanIQD || "";
        $("finance-mandoub-loan-usd").value = f.mandoubLoanUSD || "";
        $("finance-mandoub-loan-sar").value = f.mandoubLoanSAR || "";
        $("man-total").value = f.manTotal || "";
        $("man-paid").value = f.manPaid || "";
        $("man-rem").value = f.manRem || "";
        $("mandoub-eval-select").value = f.mandoubEval || "ممتاز";
        $("mandoub-eval-reason").value = f.mandoubEvalReason || "";
        
        window.editFinanceIndex = i;
        $("btn-save-finance").textContent = "تحديث المالية";
    };

    window.deleteFinance = (i) => {
        if (confirm("هل أنت متأكد من حذف هذا السجل المالي؟")) {
            appData.finances.splice(i, 1);
            saveToDB();
        }
    };

    $("btn-save-finance").addEventListener("click", () => {
        const busType = $("finance-bus-type").value;
        const busFare = Number($("finance-bus-fare").value) || 0;

        const financeData = {
            currency: $("finance-currency").value,
            busType,
            busFare,
            driverName: $("finance-driver-name").value,
            driverDebt: $("finance-driver-debt").value,
            driverAdvance: $("finance-driver-advance").value,
            driverLoanIQD: $("finance-driver-loan-iqd").value,
            driverLoanUSD: $("finance-driver-loan-usd").value,
            driverLoanSAR: $("finance-driver-loan-sar").value,
            driverTotal: $("driver-total").value,
            driverPaid: $("driver-paid").value,
            driverRem: $("driver-rem").value,
            driverEval: $("finance-driver-eval").value,
            mandoubName: $("finance-mandoub-name").value,
            mandoubAdvance: $("finance-mandoub-advance").value,
            mandoubLoanIQD: $("finance-mandoub-loan-iqd").value,
            mandoubLoanUSD: $("finance-mandoub-loan-usd").value,
            mandoubLoanSAR: $("finance-mandoub-loan-sar").value,
            manTotal: $("man-total").value,
            manPaid: $("man-paid").value,
            manRem: $("man-rem").value,
            mandoubEval: $("mandoub-eval-select").value,
            mandoubEvalReason: $("mandoub-eval-reason").value,
            date: new Date().toISOString()
        };

        if (!appData.finances) appData.finances = [];
        
        if (window.editFinanceIndex != null) {
            financeData.date = appData.finances[window.editFinanceIndex].date || financeData.date;
            appData.finances[window.editFinanceIndex] = financeData;
            window.editFinanceIndex = null;
            $("btn-save-finance").textContent = "حفظ المالية";
        } else {
            appData.finances.push(financeData);
        }

        const driverRem = Number(financeData.driverRem) || 0;
        const manRem = Number(financeData.manRem) || 0;
        const driverNameTrimmed = (financeData.driverName || "").trim();
        const mandoubNameTrimmed = (financeData.mandoubName || "").trim();
        
        if (driverRem === 0 && manRem === 0 && appData.savedTrips) {
            const activeTrip = appData.savedTrips.find(t => {
                 const td = (t.driver || "").trim();
                 const tm = (t.mandoub || "").trim();
                 return (td && td === driverNameTrimmed) || (tm && tm === mandoubNameTrimmed);
            });
            if (activeTrip) activeTrip.status = "مكتملة";
        }
        $("finance-form").reset();
        saveToDB();
        showCustomAlert("تم حفظ المالية بنجاح");
    });
}

function setupReportsSystem() {
    const wrapTd = (val) => `<td style="padding: 12px; border: 1px solid rgba(255,255,255,0.3);">${val}</td>`;

    window.showReport = (title) => {
        $("reports-main-list").classList.add("hidden");
        $("report-viewer").classList.remove("hidden");
        $("report-title").textContent = title;
        const tbody = $("report-table-body"), thead = $("report-table-head");
        tbody.innerHTML = "";
        thead.innerHTML = "";

        if (title === "تقرير عدد السفرات الكلية للمندوب والسائق والباص") {
            thead.innerHTML = `<th>تاريخ الرحلة</th><th>اسم الرحلة</th><th>المندوب</th><th>السائق</th><th>الباص</th><th>الحالة</th>`;
            (appData.savedTrips || []).forEach(t => tbody.innerHTML += `<tr>${wrapTd(t.date || "")}${wrapTd(t.name || "")}${wrapTd(t.mandoub || "")}${wrapTd(t.driver || "")}${wrapTd(t.bus || "")}${wrapTd(t.status || "")}</tr>`);
        } else if (title === "اجمالي مدة بقاء السفر") {
            thead.innerHTML = `<th>اسم الرحلة</th><th>عدد الأيام</th>`;
            (appData.savedTrips || []).forEach(t => tbody.innerHTML += `<tr>${wrapTd(t.name || "")}${wrapTd(t.days || 0)}</tr>`);
        } else if (title === "المبلغ الكلي للحوافز والاكراميات والخصومات سائق ومندوب") {
            thead.innerHTML = `<th>اسم الرحلة</th><th>اسم المندوب</th><th>حوافز المندوب</th><th>خصم المندوب</th><th>اسم السائق</th><th>حوافز السائق</th><th>خصم السائق</th>`;
            (appData.returnInfos || []).forEach(r => {
                const trip = (appData.savedTrips || []).find(t => t.name === r.tripName) || {};
                tbody.innerHTML += `<tr>${wrapTd(r.tripName || "")}${wrapTd(trip.mandoub || "")}${wrapTd(r.mandoubBonus || 0)}${wrapTd(r.mandoubDiscount || 0)}${wrapTd(trip.driver || "")}${wrapTd(r.driverBonus || 0)}${wrapTd(r.driverDiscount || 0)}</tr>`;
            });
        } else if (title === "اجمالي ايرادات المندوب والسائق") {
            thead.innerHTML = `<th>اسم الرحلة</th><th>المستخدم</th><th>نوع الإيراد</th><th>المبلغ</th><th>العملة</th><th>التاريخ</th>`;
            (appData.userIncomes || []).forEach(i => tbody.innerHTML += `<tr>${wrapTd(i.tripName || "-")}${wrapTd(i.user || "")}${wrapTd(i.type || "")}${wrapTd(i.amount || 0)}${wrapTd(i.currency || "")}${wrapTd((i.date || "").split("T")[0] || "")}</tr>`);
        } else if (title === "عدد ايام البقاء اثناء الرحلة") {
            thead.innerHTML = `<th>اسم الرحلة</th><th>اسم المندوب</th><th>اسم السائق</th><th>رقم الرحلة</th><th>عدد الأيام</th>`;
            (appData.savedTrips || []).forEach(t => tbody.innerHTML += `<tr>${wrapTd(t.name || "")}${wrapTd(t.mandoub || "")}${wrapTd(t.driver || "")}${wrapTd(t.tripNumber || "")}${wrapTd(t.days || 0)}</tr>`);
        } else if (title === "عدد الكيلومترات الصافي للسيارة") {
            thead.innerHTML = `<th>اسم الرحلة</th><th>الباص</th><th>قبل الرحلة</th><th>بعد العودة</th><th>الصافي</th>`;
            (appData.savedTrips || []).forEach(t => {
                const related = (appData.userExpenses || []).filter(e => e.tripName === t.name && e.kmAfter);
                const after = related.length ? Number(related[related.length - 1].kmAfter) || 0 : 0;
                const before = Number(t.kmBefore) || 0;
                tbody.innerHTML += `<tr>${wrapTd(t.name || "")}${wrapTd(t.bus || "")}${wrapTd(before)}${wrapTd(after)}${wrapTd(after - before)}</tr>`;
            });
        } else if (title === "عدد اللترات المصروفة بالعراق") {
            thead.innerHTML = `<th>التاريخ</th><th>المستخدم</th><th>اسم الرحلة</th><th>نوع المصروف</th><th>عدد اللترات</th>`;
            (appData.userExpenses || []).forEach(e => tbody.innerHTML += `<tr>${wrapTd((e.date || "").split("T")[0] || "")}${wrapTd(e.user || "")}${wrapTd(e.tripName || "")}${wrapTd(e.type || "")}${wrapTd(e.liters || 0)}</tr>`);
        } else if (title === "تقرير مصرف الرحلة") {
            thead.innerHTML = `<th>المستخدم</th><th>اسم الرحلة</th><th>المبلغ</th><th>النوع</th><th>التاريخ</th><th class="hide-on-pdf">الصورة</th>`;
            (appData.userExpenses || []).forEach(e => tbody.innerHTML += `<tr>${wrapTd(e.user || "")}${wrapTd(e.tripName || "")}${wrapTd((e.amount || 0) + " " + (e.currency || ""))}${wrapTd(e.type || "")}${wrapTd((e.date || "").split("T")[0] || "")}<td class="hide-on-pdf" style="padding: 12px; border: 1px solid rgba(255,255,255,0.3);">${e.imgBase64 ? `<img src="${e.imgBase64}" class="clickable-image" onclick="openImage('${e.imgBase64}')">` : "لا يوجد"}</td></tr>`);
        } else if (title === "تقرير أعطال الصيانة") {
            thead.innerHTML = `<th>المستخدم</th><th>اسم الرحلة</th><th>الباص</th><th>المبلغ</th><th>الخيار</th><th>التاريخ</th><th class="hide-on-pdf">الصورة</th>`;
            (appData.userBusExpenses || []).forEach(e => tbody.innerHTML += `<tr>${wrapTd(e.user || "")}${wrapTd(e.tripName || "")}${wrapTd(e.car || "")}${wrapTd((e.amount || 0) + " " + (e.currency || ""))}${wrapTd(e.opts || "")}${wrapTd((e.date || "").split("T")[0] || "")}<td class="hide-on-pdf" style="padding: 12px; border: 1px solid rgba(255,255,255,0.3);">${e.imgBase64 ? `<img src="${e.imgBase64}" class="clickable-image" onclick="openImage('${e.imgBase64}')">` : "لا يوجد"}</td></tr>`);
        }

        if (tbody.innerHTML === "") tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;">لا توجد بيانات</td></tr>`;
    };

    window.hideReport = () => {
        $("reports-main-list").classList.remove("hidden");
        $("report-viewer").classList.add("hidden");
    };

    window.searchReport = () => {
        const query = $("report-search-input").value.toLowerCase();
        document.querySelectorAll("#report-table-body tr").forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none";
        });
    };

    window.exportReportExcel = () => {
        const csv = [];
        document.querySelectorAll("#report-table tr").forEach(row => {
            if(row.style.display !== 'none') {
                const rowData = [];
                row.querySelectorAll("td:not(.hide-on-pdf), th:not(.hide-on-pdf)").forEach(col => rowData.push(`"${col.innerText.replace(/(\r\n|\n|\r)/gm, "").replace(/"/g, '""')}"`));
                csv.push(rowData.join(","));
            }
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI("data:text/csv;charset=utf-8,\uFEFF" + csv.join("\n")));
        link.setAttribute("download", $("report-title").textContent + ".csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // تقنية معالجة الجدول وتحويله لـ PDF بخلفية بيضاء وبدون صور مكسورة
    window.exportReportPDF = () => {
        const table = document.getElementById("report-table");
        if(table.rows.length <= 1) { showCustomAlert("لا توجد بيانات للتصدير"); return; }

        const clone = table.cloneNode(true);
        clone.style.color = "black";
        clone.style.backgroundColor = "white";
        clone.style.direction = "rtl";
        clone.querySelectorAll("th, td").forEach(cell => {
            cell.style.color = "black";
            cell.style.border = "1px solid black";
        });
        
        clone.querySelectorAll(".hide-on-pdf").forEach(el => el.remove());

        const container = document.createElement("div");
        container.style.padding = "20px";
        container.style.backgroundColor = "white";
        container.dir = "rtl";
        
        const title = document.createElement("h2");
        title.textContent = $("report-title").textContent;
        title.style.color = "black";
        title.style.textAlign = "center";
        title.style.marginBottom = "20px";
        title.style.fontFamily = "Arial, sans-serif";
        
        container.appendChild(title);
        container.appendChild(clone);
        
        const opt = {
            margin:       0.5,
            filename:     $("report-title").textContent + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
        };
        
        html2pdf().set(opt).from(container).save();
    };
}

// === ADMIN WALLET CONTROL ===
function addWallet(user,iqd,usd,sar){
  if(!appData.wallets) appData.wallets = {};
  if(!appData.wallets[user]) appData.wallets[user] = {iqd:0,usd:0,sar:0};
  appData.wallets[user].iqd += Number(iqd)||0;
  appData.wallets[user].usd += Number(usd)||0;
  appData.wallets[user].sar += Number(sar)||0;
  saveToDB();
}
