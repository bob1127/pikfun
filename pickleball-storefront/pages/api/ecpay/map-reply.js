// 綠界電子地圖選完門市後，瀏覽器會 POST 門市資料到這裡
// 回傳一個小頁面，把門市資料 postMessage 回結帳頁並關閉視窗
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.redirect(302, "/checkout");
  }

  const body = req.body || {};
  const store = {
    id: body.CVSStoreID || "",
    name: body.CVSStoreName || "",
    address: body.CVSAddress || "",
    phone: body.CVSTelephone || "",
    subType: body.ExtraData || "",
  };

  // 防止把 </script> 之類的內容注入頁面
  const storeJson = JSON.stringify(store)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8" /><title>門市已選擇</title></head>
<body style="font-family:sans-serif;text-align:center;padding:48px 16px;color:#333;">
<p>門市選擇完成，正在回到結帳頁…</p>
<script>
  (function () {
    var store = ${storeJson};
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: "ecpay-cvs-store", store: store }, window.location.origin);
      window.close();
    } else {
      document.body.innerHTML =
        "<p>已選擇門市：" + store.name + "（" + store.address + "）</p>" +
        "<p>請回到結帳頁繼續完成訂單。</p>";
    }
  })();
</script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}
