(function(){
  function gateStatusFor(){
    var p = window.fbCurrentProfile;
    if (!window.fbCurrentUser || !p || p.role !== "doctor") return null;
    if (typeof getMyDoctorEntry !== "function") return null;
    var entry = getMyDoctorEntry();
    if (!entry) return null;
    return entry.verificationStatus || "not_submitted";
  }

  function showGate(rejected){
    if (document.getElementById("licenseGate")) return;
    var box = document.createElement("div");
    box.id = "licenseGate";
    box.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;direction:rtl;";
    var msg = rejected
      ? "تم رفض الرخصة السابقة. ارفع صورة رخصة مزاولة المهنة الواضحة لإعادة المحاولة."
      : "قبل استخدام حسابك، ارفع صورة رخصة مزاولة المهنة. بعد الرفع ستراجعها الإدارة.";
    box.innerHTML =
      '<div style="background:#fff;color:#111;border-radius:16px;padding:22px;max-width:420px;width:100%;text-align:center;">' +
        '<h3 style="margin:0 0 10px;color:#0f6e56;">توثيق الرخصة مطلوب</h3>' +
        '<p style="margin:0 0 14px;line-height:1.7;">' + msg + '</p>' +
        '<input type="file" id="doctorLicenseFile" accept="image/*" style="width:100%;margin-bottom:12px;">' +
        '<button id="gateSubmitBtn" style="width:100%;padding:12px;border:0;border-radius:10px;background:#0f6e56;color:#fff;font-size:16px;margin-bottom:10px;">إرسال الرخصة للمراجعة</button>' +
        '<button id="gateLogoutBtn" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:10px;background:#fff;color:#444;">تسجيل الخروج</button>' +
      '</div>';
    document.body.appendChild(box);
    document.getElementById("gateSubmitBtn").onclick = function(){
      if (typeof submitDoctorVerification === "function") submitDoctorVerification();
    };
    document.getElementById("gateLogoutBtn").onclick = function(){
      if (window.fbSignOut) window.fbSignOut().then(function(){ location.reload(); });
    };
  }

  function hideGate(){
    var g = document.getElementById("licenseGate");
    if (g) g.remove();
  }

  function gateCheck(){
    try{
      var st = gateStatusFor();
      if (st === "not_submitted" || st === "rejected") showGate(st === "rejected");
      else hideGate();
    }catch(e){}
  }

  setInterval(gateCheck, 1500);
})();
