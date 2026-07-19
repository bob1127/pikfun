"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "../components/context/CartContext";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  ChevronRight,
  CreditCard,
  Lock,
  Globe,
  MapPin,
  Store,
  Home,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Link from "next/link";
import Image from "next/image";
import { State, City } from "country-state-city";
import { TAIWAN_CITIES } from "../lib/taiwanCities";

// Shopify 風格的輸入框樣式
const inputClass =
  "w-full rounded-[5px] border border-[#d9d9d9] bg-white px-3 py-[13px] text-sm text-[#333] placeholder:text-[#707070] outline-none transition-shadow focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/25";
const selectClass =
  "w-full rounded-[5px] border border-[#d9d9d9] bg-white px-3 py-[13px] text-sm text-[#333] outline-none transition-shadow focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/25";

// 台灣超商取貨選項（對應綠界電子地圖）
const CVS_BRANDS = [
  { key: "UNIMART", label: "7-ELEVEN" },
  { key: "FAMI", label: "全家 FamilyMart" },
  { key: "HILIFE", label: "萊爾富 Hi-Life" },
];

export default function CheckoutPage() {
  const { cartItems } = useCart();
  const router = useRouter();
  const { t } = useTranslation("common");

  const defaultCountry =
    router.locale === "en" ? "US" : router.locale === "ko" ? "KR" : "TW";

  const targetCurrency =
    router.locale === "en" ? "usd" : router.locale === "ko" ? "krw" : "twd";
  const symbol =
    targetCurrency === "usd" ? "$ " : targetCurrency === "krw" ? "₩ " : "NT$ ";
  const currencyCode = targetCurrency.toUpperCase();
  const metaLang = router.locale === "zh-TW" ? "zh" : router.locale;

  const [loading, setLoading] = useState(false);
  const isProcessing = useRef(false);
  const [exchangeRate, setExchangeRate] = useState(1350);
  const [discountCode, setDiscountCode] = useState("");
  const [discountError, setDiscountError] = useState("");

  // 運送方式：HOME（宅配）或 UNIMART / FAMI / HILIFE（超商取貨）
  const [shippingMethod, setShippingMethod] = useState("HOME");
  const [cvsStore, setCvsStore] = useState(null);

  // 接收綠界電子地圖視窗回傳的門市資料
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "ecpay-cvs-store" && e.data.store?.id) {
        setCvsStore(e.data.store);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // 開啟綠界超商電子地圖（新視窗）
  const openCvsMap = async (brandKey) => {
    const mapWindow = window.open(
      "about:blank",
      "ecpayCvsMap",
      "width=1020,height=760",
    );
    try {
      const res = await fetch("/api/ecpay/map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subType: brandKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "開啟門市地圖失敗");

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.action;
      form.target = "ecpayCvsMap";
      Object.entries(data.params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
      form.remove();
    } catch (err) {
      mapWindow?.close();
      alert(err.message);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: defaultCountry,
    city: "",
    district: "",
    street: "",
    remark: "",
    paymentMethod: defaultCountry === "TW" ? "ECPAY" : "PAYPAL",
  });

  // 強制語系重整機制
  const initialLocaleRef = useRef(router.locale);
  useEffect(() => {
    if (initialLocaleRef.current !== router.locale) {
      window.location.reload();
    }
  }, [router.locale]);

  const availableStates = useMemo(() => {
    if (formData.country === "TW") return [];
    return State.getStatesOfCountry(formData.country);
  }, [formData.country]);

  const availableCities = useMemo(() => {
    if (formData.country === "TW" || !formData.city) return [];
    return City.getCitiesOfState(formData.country, formData.city);
  }, [formData.country, formData.city]);

  const totalWeight = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const weight = item.variant?.weight || item.weight || 0;
      return acc + weight * item.quantity;
    }, 0);
  }, [cartItems]);

  // 依語系幣別計算單品價格
  const getItemPrice = (item) => {
    let currentRawPrice =
      item.rawPrice ||
      parseInt(String(item.price).replace(/[^\d]/g, ""), 10) ||
      0;
    if (item.prices && item.prices.length > 0) {
      const matchedPrice = item.prices.find(
        (p) => p.currency_code?.toLowerCase() === targetCurrency,
      );
      if (matchedPrice) {
        currentRawPrice =
          matchedPrice.amount > 1000000
            ? matchedPrice.amount / 100
            : matchedPrice.amount;
      }
    }
    return currentRawPrice;
  };

  const total = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + getItemPrice(item) * item.quantity,
      0,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, targetCurrency]);

  const shippingInfo = useMemo(() => {
    if (formData.country === "TW") {
      if (shippingMethod !== "HOME") {
        const brand = CVS_BRANDS.find((b) => b.key === shippingMethod);
        return {
          cost: 0,
          name: `${brand?.label || ""} ${t("checkout.cvsPickup", "超商取貨")}`,
          currency: "TWD",
          sign: "NT$",
        };
      }
      return {
        cost: 0,
        name: t("checkout.shippingDelivery", "宅配到府 (順豐速運)"),
        currency: "TWD",
        sign: "NT$",
      };
    }

    if (formData.country === "US") {
      if (totalWeight <= 500)
        return {
          cost: 45,
          name: "DHL Express (0-0.5kg)",
          currency: "USD",
          sign: "$",
        };
      if (totalWeight <= 1500)
        return {
          cost: 65,
          name: "DHL Express (0.5-1.5kg)",
          currency: "USD",
          sign: "$",
        };
      return {
        cost: 90,
        name: "DHL Express (1.5-3kg)",
        currency: "USD",
        sign: "$",
      };
    }

    if (formData.country === "KR") {
      if (totalWeight <= 500)
        return {
          cost: 35000,
          name: "DHL Express (0-0.5kg)",
          currency: "KRW",
          sign: "₩",
        };
      if (totalWeight <= 1500)
        return {
          cost: 48000,
          name: "DHL Express (0.5-1.5kg)",
          currency: "KRW",
          sign: "₩",
        };
      return {
        cost: 65000,
        name: "DHL Express (1.5-3kg)",
        currency: "KRW",
        sign: "₩",
      };
    }

    return {
      cost: 45,
      name: "DHL Express (0-0.5kg)",
      currency: "USD",
      sign: "$",
    };
  }, [formData.country, shippingMethod, totalWeight, t]);

  // 切換運送方式：換超商品牌時清掉已選門市
  const handleShippingMethodChange = (method) => {
    setShippingMethod(method);
    if (method === "HOME" || method !== shippingMethod) {
      setCvsStore(null);
    }
  };

  useEffect(() => {
    if (shippingInfo.currency === "KRW") {
      const fetchRate = async () => {
        try {
          const res = await fetch("https://open.er-api.com/v6/latest/USD");
          const data = await res.json();
          if (data.rates && data.rates.KRW) {
            setExchangeRate(data.rates.KRW);
          }
        } catch (error) {
          console.warn("⚠️ 匯率 API 抓取失敗", error);
        }
      };
      fetchRate();
    }
  }, [shippingInfo.currency]);

  useEffect(() => {
    if (defaultCountry !== "TW") {
      setFormData((prev) => ({
        ...prev,
        country: defaultCountry,
        city: "",
        district: "",
        street: "",
        paymentMethod: "PAYPAL",
      }));
    }
  }, [defaultCountry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "country") {
        const resetPayment = value === "TW" ? "ECPAY" : "PAYPAL";
        if (value !== "TW") {
          setShippingMethod("HOME");
          setCvsStore(null);
        }
        return {
          ...prev,
          country: value,
          city: "",
          district: "",
          paymentMethod: resetPayment,
        };
      }
      if (name === "city") {
        return { ...prev, [name]: value, district: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const isCvsPickup = formData.country === "TW" && shippingMethod !== "HOME";

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert(t("checkout.alert.fillInfo", "請填寫完整收件資訊"));
      return false;
    }
    if (isCvsPickup) {
      if (!cvsStore) {
        alert(t("checkout.alert.selectStore", "請先選擇取貨門市"));
        return false;
      }
      return true;
    }
    if (
      !formData.city ||
      !formData.street ||
      (formData.country === "TW" && !formData.district)
    ) {
      alert(t("checkout.alert.fillInfo", "請填寫完整收件資訊"));
      return false;
    }
    return true;
  };

  // 建立 Medusa 購物車（訂單資料），回傳 cartId
  const createMedusaCart = async () => {
    const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    const token = localStorage.getItem("medusa_auth_token");
    const headers = {
      "Content-Type": "application/json",
      "x-publishable-api-key": PUBLISHABLE_API_KEY,
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const backendUrl =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";

    const regionRes = await fetch(`${backendUrl}/store/regions`, { headers });
    const regions = (await regionRes.json()).regions;
    const targetRegion =
      regions.find((r) =>
        r.countries.some((c) => c.iso_2 === formData.country.toLowerCase()),
      ) || regions[0];

    const stateName =
      formData.country === "TW"
        ? formData.city
        : State.getStateByCodeAndCountry(formData.city, formData.country)
            ?.name || formData.city;

    const cvsBrandLabel = isCvsPickup
      ? CVS_BRANDS.find((b) => b.key === shippingMethod)?.label || ""
      : "";

    const cartRes = await fetch(`${backendUrl}/store/carts`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        region_id: targetRegion.id,
        email: formData.email,
        metadata: {
          payment_method: formData.paymentMethod,
          remark: formData.remark,
          shipping_method: isCvsPickup ? `CVS_${shippingMethod}` : "HOME",
          ...(isCvsPickup && cvsStore
            ? {
                cvs_store_id: cvsStore.id,
                cvs_store_name: cvsStore.name,
                cvs_store_address: cvsStore.address,
                cvs_brand: cvsBrandLabel,
              }
            : {}),
        },
        shipping_address: isCvsPickup
          ? {
              first_name: formData.name,
              phone: formData.phone,
              province: "",
              city: cvsStore?.name || "",
              address_1: `【${cvsBrandLabel}取貨】${cvsStore?.name || ""}（${cvsStore?.id || ""}）${cvsStore?.address || ""}`,
              country_code: "tw",
            }
          : {
              first_name: formData.name,
              phone: formData.phone,
              province: stateName,
              city: formData.district,
              address_1: formData.street,
              country_code: formData.country.toLowerCase(),
            },
      }),
    });

    const cartData = await cartRes.json();
    const cartId = cartData.cart.id;

    for (const item of cartItems) {
      const currentVariantId = item.variantId || item.variant_id;
      if (!currentVariantId)
        throw new Error(`商品「${item.title}」資料異常，找不到變體 ID。`);

      const lineItemRes = await fetch(
        `${backendUrl}/store/carts/${cartId}/line-items`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            variant_id: currentVariantId,
            quantity: item.quantity,
          }),
        },
      );

      if (!lineItemRes.ok) {
        const errData = await lineItemRes.json();
        throw new Error(
          `商品「${item.title}」加入失敗。\n系統回報：${errData.message || "未知錯誤"}`,
        );
      }
    }

    const shipOptRes = await fetch(
      `${backendUrl}/store/shipping-options?cart_id=${cartId}`,
      { headers },
    );
    const shipOptData = await shipOptRes.json();

    if (shipOptData.shipping_options?.length > 0) {
      const matchedOption = shipOptData.shipping_options.find(
        (opt) => opt.name === shippingInfo.name,
      );
      const selectedOptionId = matchedOption
        ? matchedOption.id
        : shipOptData.shipping_options[0].id;

      await fetch(`${backendUrl}/store/carts/${cartId}/shipping-methods`, {
        method: "POST",
        headers,
        body: JSON.stringify({ option_id: selectedOptionId }),
      });
    }

    return cartId;
  };

  // 以隱藏表單將付款參數 POST 到綠界付款頁
  const redirectToEcpay = (action, params) => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    Object.entries(params).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  };

  // 台灣結帳：建立訂單資料 → 導向綠界付款
  const executeEcpayCheckout = async () => {
    if (isProcessing.current) return;
    if (!validateForm()) return;
    isProcessing.current = true;

    try {
      setLoading(true);
      const cartId = await createMedusaCart();

      const itemName = cartItems
        .map((item) => {
          const title = item.metadata?.[`title_${metaLang}`] || item.title;
          return `${title} x${item.quantity}`;
        })
        .join("#");

      const ecpayRes = await fetch("/api/ecpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(total + shippingInfo.cost),
          itemName,
          cartId,
          // 一律於綠界頁面選擇付款方式（信用卡 / ATM / 超商代碼等）
          paymentType: "ALL",
        }),
      });

      const ecpayData = await ecpayRes.json();
      if (!ecpayRes.ok)
        throw new Error(ecpayData?.message || "建立綠界付款失敗");

      redirectToEcpay(ecpayData.action, ecpayData.params);
    } catch (err) {
      console.error("❌ Checkout 錯誤:", err);
      alert(`錯誤：\n${err.message}`);
      isProcessing.current = false;
      setLoading(false);
    }
  };

  // 海外結帳：PayPal 付款完成後建立訂單資料
  const executePaypalCheckout = async (paypalOrderId) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    try {
      setLoading(true);
      await createMedusaCart();
      router.push("/checkout/success");
    } catch (err) {
      console.error("❌ Checkout 錯誤:", err);
      alert(`錯誤：\n${err.message}`);
    } finally {
      isProcessing.current = false;
      setLoading(false);
    }
  };

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) return;
    setDiscountError(t("checkout.discountInvalid", "折扣碼無效或尚未開放使用"));
  };

  if (cartItems.length === 0)
    return (
      <div className="p-32 text-center text-gray-400">
        {t("checkout.emptyBag", "購物車是空的")}
      </div>
    );

  const isKRW = shippingInfo.currency === "KRW";
  const paypalCurrency = isKRW ? "USD" : shippingInfo.currency;
  const isTW = formData.country === "TW";
  const grandTotal = total + shippingInfo.cost;

  const paypalButtons = (
    <PayPalButtons
      style={{ layout: "horizontal", height: 44 }}
      onClick={(data, actions) => {
        if (
          !formData.name ||
          !formData.email ||
          !formData.phone ||
          !formData.city ||
          !formData.street
        ) {
          alert(t("checkout.alert.fillInfo", "請填寫完整收件資訊"));
          return actions.reject();
        }
        return actions.resolve();
      }}
      createOrder={(data, actions) => {
        let finalAmountValue = Math.max(
          1,
          Math.round(total + shippingInfo.cost),
        );
        if (isKRW) {
          finalAmountValue = (finalAmountValue / exchangeRate).toFixed(2);
        } else {
          finalAmountValue = finalAmountValue.toString();
        }
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                currency_code: paypalCurrency,
                value: finalAmountValue,
              },
              description: isKRW
                ? `Converted from KRW (Rate 1:${Math.round(exchangeRate)})`
                : "",
            },
          ],
        });
      }}
      onApprove={async (data) => {
        try {
          await executePaypalCheckout(data.orderID);
        } catch (error) {
          console.error("PayPal 錯誤:", error);
          alert("付款失敗，請重新嘗試");
        }
      }}
    />
  );

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb",
        currency: paypalCurrency,
        intent: "capture",
        components: "buttons",
      }}
    >
      <div className="min-h-screen bg-white  text-[#333]">
        <div className="flex flex-col-reverse lg:flex-row">
          {/* ======================= */}
          {/* 左側：結帳表單 */}
          {/* ======================= */}
          <main className="w-full border-t border-[#e6e6e6] px-5 py-9 lg:w-[55%] lg:border-t-0 lg:px-0 lg:py-14">
            <div className="mx-auto w-full max-w-[560px] lg:ml-auto lg:mr-14">
              {/* 商店名稱 + 麵包屑 */}
              <h1 className="text-[22px] font-semibold tracking-tight text-black">
                PikFun 匹克方
              </h1>
              <nav
                aria-label="Breadcrumb"
                className="mb-9 mt-3 flex items-center gap-1.5 text-xs text-[#707070]"
              >
                <Link href="/cart" className="text-[#2563eb] hover:underline">
                  {t("checkout.breadcrumbCart", "購物車")}
                </Link>
                <ChevronRight size={12} />
                <span className="font-medium text-black">
                  {t("checkout.breadcrumbInfo", "資料填寫")}
                </span>
                <ChevronRight size={12} />
                <span>{t("checkout.breadcrumbPayment", "付款")}</span>
              </nav>

              {/* 快速結帳（海外 PayPal） */}
              {!isTW && (
                <div className="mb-8">
                  <div className="relative mb-4 text-center">
                    <span className="relative z-10 bg-white px-3 text-xs text-[#707070]">
                      {t("checkout.expressCheckout", "快速結帳")}
                    </span>
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#e6e6e6]"></span>
                  </div>
                  <div className="relative z-0 mx-auto max-w-[420px]">
                    {paypalButtons}
                  </div>
                  <div className="relative mt-4 text-center">
                    <span className="relative z-10 bg-white px-3 text-xs text-[#707070]">
                      {t("checkout.or", "或")}
                    </span>
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-[#e6e6e6]"></span>
                  </div>
                </div>
              )}

              {/* 聯絡資訊 */}
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-black">
                  {t("checkout.contactInfo", "聯絡資訊")}
                </h2>
                <div className="space-y-3">
                  <div>
                    <input
                      type="email"
                      name="email"
                      placeholder={t("checkout.emailPlaceholder", "電子信箱")}
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <p className="mt-1.5 px-1 text-xs text-[#999]">
                      {t(
                        "checkout.emailUsage",
                        "用途：訂單通知 / 出貨通知 / 驗證",
                      )}
                    </p>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder={t(
                      "checkout.phonePlaceholder",
                      "聯絡電話 例：0912-345-678",
                    )}
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </section>

              {/* 運送方式 */}
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-black">
                  {t("checkout.shippingMethod", "運送方式")}
                </h2>

                {isTW ? (
                  <div className="overflow-hidden rounded-[5px] border border-[#d9d9d9]">
                    {/* 超商取貨選項 */}
                    {CVS_BRANDS.map((brand, idx) => {
                      const selected = shippingMethod === brand.key;
                      return (
                        <React.Fragment key={brand.key}>
                          <label
                            className={`flex cursor-pointer items-center justify-between px-4 py-[15px] transition-colors ${
                              idx === 0 ? "" : "border-t border-[#e6e6e6]"
                            } ${selected ? "bg-[#f4f7ff]" : "hover:bg-[#fafafa]"}`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="shippingMethod"
                                checked={selected}
                                onChange={() =>
                                  handleShippingMethodChange(brand.key)
                                }
                                className="h-[18px] w-[18px] accent-[#2563eb]"
                              />
                              <span className="flex items-center gap-2 text-sm">
                                <Store size={16} className="text-[#707070]" />
                                {brand.label}{" "}
                                {t("checkout.cvsPickup", "超商取貨")}
                              </span>
                            </div>
                            <span className="text-sm font-medium">
                              {t("checkout.freeShippingLabel", "免費")}
                            </span>
                          </label>
                          {selected && (
                            <div className="border-t border-[#e6e6e6] bg-[#fafafa] px-4 py-4">
                              {cvsStore ? (
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="text-sm">
                                    <p className="font-medium text-black">
                                      {cvsStore.name}（{cvsStore.id}）
                                    </p>
                                    <p className="mt-0.5 text-[13px] text-[#707070]">
                                      {cvsStore.address}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => openCvsMap(brand.key)}
                                    className="shrink-0 rounded-[5px] border border-[#2563eb] px-4 py-2 text-sm font-medium text-[#2563eb] transition-colors hover:bg-[#f4f7ff]"
                                  >
                                    {t("checkout.rePickStore", "重新選擇門市")}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => openCvsMap(brand.key)}
                                  className="flex w-full items-center justify-center gap-2 rounded-[5px] bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1d4fd8]"
                                >
                                  <MapPin size={16} />
                                  {t(
                                    "checkout.pickStore",
                                    "點擊開啟地圖選擇門市",
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* 宅配 */}
                    <label
                      className={`flex cursor-pointer items-center justify-between border-t border-[#e6e6e6] px-4 py-[15px] transition-colors ${
                        shippingMethod === "HOME"
                          ? "bg-[#f4f7ff]"
                          : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shippingMethod"
                          checked={shippingMethod === "HOME"}
                          onChange={() => handleShippingMethodChange("HOME")}
                          className="h-[18px] w-[18px] accent-[#2563eb]"
                        />
                        <span className="flex items-center gap-2 text-sm">
                          <Home size={16} className="text-[#707070]" />
                          {t(
                            "checkout.shippingHome",
                            "宅配到府（自行輸入地址）",
                          )}
                        </span>
                      </div>
                      <span className="text-sm font-medium">
                        {t("checkout.freeShippingLabel", "免費")}
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-[5px] border border-[#2563eb] bg-[#f4f7ff] px-4 py-[15px]">
                    <div className="flex items-center gap-3">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-[5px] border-[#2563eb] bg-white"></span>
                      <span className="text-sm">{shippingInfo.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {shippingInfo.cost === 0
                        ? t("checkout.freeShippingLabel", "免費")
                        : `${shippingInfo.sign} ${shippingInfo.cost.toLocaleString()}`}
                    </span>
                  </div>
                )}
              </section>

              {/* 收件資訊 / 運送地址 */}
              <section className="mb-10">
                <h2 className="mb-4 text-lg font-semibold text-black">
                  {isCvsPickup
                    ? t("checkout.pickupInfo", "取貨人資訊")
                    : t("checkout.shippingAddress", "運送地址")}
                </h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="name"
                    placeholder={
                      isCvsPickup
                        ? t(
                            "checkout.pickupNamePlaceholder",
                            "取貨人完整姓名（需與證件相符）",
                          )
                        : t(
                            "checkout.fullNamePlaceholder",
                            "收件人完整姓名（需與證件相符）",
                          )
                    }
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                  />

                  {!isCvsPickup && (
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="TW">Taiwan (台灣)</option>
                      <option value="US">United States (美國)</option>
                      <option value="KR">South Korea (韓國)</option>
                    </select>
                  )}

                  {!isCvsPickup && (
                  <div className="grid grid-cols-2 gap-3">
                    {isTW ? (
                      <>
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className={selectClass}
                        >
                          <option value="" disabled>
                            {t("checkout.selectCity", "選擇縣市")}
                          </option>
                          {Object.keys(TAIWAN_CITIES).map((city) => (
                            <option key={city} value={city}>
                              {city}
                            </option>
                          ))}
                        </select>
                        <select
                          name="district"
                          value={formData.district}
                          onChange={handleChange}
                          disabled={!formData.city}
                          className={`${selectClass} ${!formData.city ? "bg-[#fafafa] text-[#b0b0b0]" : ""}`}
                        >
                          <option value="" disabled>
                            {t("checkout.selectDistrict", "選擇區域")}
                          </option>
                          {formData.city &&
                            TAIWAN_CITIES[formData.city].map((district) => (
                              <option key={district} value={district}>
                                {district}
                              </option>
                            ))}
                        </select>
                      </>
                    ) : (
                      <>
                        {availableStates.length > 0 ? (
                          <select
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className={selectClass}
                          >
                            <option value="" disabled>
                              {t("checkout.stateProvince", "State / Province")}
                            </option>
                            {availableStates.map((state) => (
                              <option key={state.isoCode} value={state.isoCode}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="city"
                            placeholder={t(
                              "checkout.stateProvince",
                              "State / Province",
                            )}
                            value={formData.city}
                            onChange={handleChange}
                            className={inputClass}
                          />
                        )}

                        {availableCities.length > 0 ? (
                          <select
                            name="district"
                            value={formData.district}
                            onChange={handleChange}
                            disabled={!formData.city}
                            className={`${selectClass} ${!formData.city ? "bg-[#fafafa] text-[#b0b0b0]" : ""}`}
                          >
                            <option value="" disabled>
                              {t("checkout.city", "City")}
                            </option>
                            {availableCities.map((city) => (
                              <option key={city.name} value={city.name}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            name="district"
                            placeholder={t("checkout.city", "City")}
                            value={formData.district}
                            onChange={handleChange}
                            disabled={
                              !formData.city && availableStates.length > 0
                            }
                            className={inputClass}
                          />
                        )}
                      </>
                    )}
                  </div>
                  )}

                  {!isCvsPickup && (
                    <input
                      type="text"
                      name="street"
                      placeholder={t(
                        "checkout.streetPlaceholder",
                        "詳細地址（門牌、樓層、公司名稱）",
                      )}
                      value={formData.street}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  )}

                  <textarea
                    name="remark"
                    placeholder={t(
                      "checkout.remarkPlaceholder",
                      "備註（如：指定收件時間、禮物包裝、低調出貨）",
                    )}
                    value={formData.remark}
                    onChange={handleChange}
                    className={`${inputClass} h-24 resize-none`}
                  />
                </div>
              </section>

              {/* 付款 */}
              <section>
                <h2 className="mb-1 text-lg font-semibold text-black">
                  {t("checkout.payment", "付款")}
                </h2>
                <p className="mb-4 flex items-center gap-1.5 text-xs text-[#707070]">
                  <Lock size={12} />
                  {t(
                    "checkout.paymentSecurity1",
                    "所有交易均透過綠界科技（ECPay）安全加密處理",
                  )}
                </p>

                {isTW ? (
                  <div className="overflow-hidden rounded-[5px] border border-[#d9d9d9]">
                    {/* 綠界線上付款（單一選項，一律跳轉綠界頁面） */}
                    <label className="flex items-center justify-between bg-[#f4f7ff] px-4 py-[15px]">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked
                          readOnly
                          className="h-[18px] w-[18px] accent-[#2563eb]"
                        />
                        <span className="flex items-center gap-2 text-sm">
                          <CreditCard size={16} className="text-[#707070]" />
                          {t(
                            "checkout.ecpayOnline",
                            "綠界線上付款（信用卡 / ATM / 超商代碼）",
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <img
                          src="/images/svg/visa-svgrepo-com.svg"
                          alt="Visa"
                          className="h-5 w-auto"
                        />
                        <img
                          src="/images/svg/mastercard-svgrepo-com.svg"
                          alt="Mastercard"
                          className="h-5 w-auto"
                        />
                        <img
                          src="/images/svg/jcb-3-svgrepo-com.svg"
                          alt="JCB"
                          className="h-5 w-auto"
                        />
                      </div>
                    </label>
                    <div className="border-t border-[#e6e6e6] bg-[#fafafa] px-4 py-5 text-center text-[13px] leading-relaxed text-[#707070]">
                      {t(
                        "checkout.ecpayRedirectNote",
                        "點選「前往付款」後，將導向綠界（ECPay）安全付款頁面，可選擇信用卡、ATM 轉帳或超商代碼完成付款。",
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[5px] border border-[#d9d9d9]">
                    <label className="flex items-center justify-between bg-[#f4f7ff] px-4 py-[15px]">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked
                          readOnly
                          className="h-[18px] w-[18px] accent-[#2563eb]"
                        />
                        <span className="flex items-center gap-2 text-sm">
                          <Globe size={16} className="text-[#707070]" />
                          {t("checkout.paypal", "PayPal")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <img
                          src="/images/svg/paypal-svgrepo-com.svg"
                          alt="PayPal"
                          className="h-5 w-auto"
                        />
                        <img
                          src="/images/svg/visa-svgrepo-com.svg"
                          alt="Visa"
                          className="h-5 w-auto"
                        />
                        <img
                          src="/images/svg/mastercard-svgrepo-com.svg"
                          alt="Mastercard"
                          className="h-5 w-auto"
                        />
                      </div>
                    </label>
                    <div className="border-t border-[#e6e6e6] bg-[#fafafa] px-4 py-5">
                      <div className="relative z-0 mx-auto max-w-[320px]">
                        {paypalButtons}
                      </div>
                    </div>
                  </div>
                )}

                {/* 前往付款按鈕（綠界） */}
                {isTW && (
                  <div className="mt-8 flex flex-col-reverse items-center gap-5 sm:flex-row sm:justify-between">
                    <Link
                      href="/cart"
                      className="text-sm text-[#2563eb] hover:underline"
                    >
                      &lt; {t("checkout.backToBag", "返回購物車")}
                    </Link>
                    <button
                      type="button"
                      onClick={executeEcpayCheckout}
                      disabled={loading || isProcessing.current}
                      className={`w-full rounded-[5px] bg-[#2563eb] px-8 py-[15px] text-sm font-semibold text-white transition-colors hover:bg-[#1d4fd8] sm:w-auto ${
                        loading || isProcessing.current
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      {loading || isProcessing.current
                        ? t("checkout.processing", "處理中...")
                        : t("checkout.completePurchase", "前往付款")}
                    </button>
                  </div>
                )}
              </section>

              {/* 頁尾政策連結 */}
              <footer className="mt-14 border-t border-[#e6e6e6] pt-5">
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#2563eb]">
                  <Link href="/shipping" className="hover:underline">
                    {t("checkout.policyShipping", "退換貨政策")}
                  </Link>
                  <Link href="/note" className="hover:underline">
                    {t("checkout.policyPrivacy", "購物須知")}
                  </Link>
                  <Link href="/service" className="hover:underline">
                    {t("checkout.policyTerms", "服務條款")}
                  </Link>
                </div>
              </footer>
            </div>
          </main>

          {/* ======================= */}
          {/* 右側：訂單摘要 */}
          {/* ======================= */}
          <aside className="w-full bg-[#f5f5f5] px-5 py-8 lg:w-[45%] lg:border-l lg:border-[#e6e6e6] lg:px-0 lg:py-14">
            <div className="mx-auto w-full max-w-[440px] lg:ml-14 lg:mr-auto lg:sticky lg:top-32">
              {/* 商品列表 */}
              <div className="mb-6 flex flex-col gap-4">
                {cartItems.map((item) => {
                  const itemImage =
                    item.thumbnail ||
                    item.image ||
                    (item.images && item.images[0]) ||
                    "";
                  const displayTitle =
                    item.metadata?.[`title_${metaLang}`] || item.title;
                  const price = getItemPrice(item);

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[#dedede] bg-white">
                            {itemImage && (
                              <Image
                                src={itemImage}
                                alt={displayTitle}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                          <span className="absolute -right-2 -top-2 flex h-[21px] w-[21px] items-center justify-center rounded-full bg-[#666] text-[11px] font-medium text-white shadow-sm">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex flex-col pr-2">
                          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[#333]">
                            {displayTitle}
                          </h3>
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-sm font-medium text-[#333]">
                        {symbol}
                        {(price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 折扣碼 */}
              <div className="mb-6 border-y border-[#e1e1e1] py-5">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setDiscountError("");
                    }}
                    placeholder={t(
                      "checkout.discountPlaceholder",
                      "禮品卡或折扣碼",
                    )}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscount}
                    disabled={!discountCode.trim()}
                    className={`rounded-[5px] px-5 text-sm font-medium transition-colors ${
                      discountCode.trim()
                        ? "bg-[#2563eb] text-white hover:bg-[#1d4fd8]"
                        : "cursor-not-allowed bg-[#e6e6e6] text-[#999]"
                    }`}
                  >
                    {t("checkout.discountApply", "套用")}
                  </button>
                </div>
                {discountError && (
                  <p className="mt-2 px-1 text-xs text-[#d72c0d]">
                    {discountError}
                  </p>
                )}
              </div>

              {/* 金額 */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#555]">
                    {t("checkout.subtotal", "小計")}
                  </span>
                  <span className="font-medium">
                    {symbol}
                    {total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#555]">
                    {t("checkout.shipping", "運費")}
                  </span>
                  <span className="font-medium">
                    {shippingInfo.cost === 0
                      ? t("checkout.freeShippingLabel", "免費")
                      : `${symbol}${shippingInfo.cost.toLocaleString()}`}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#e1e1e1] pt-4">
                  <span className="text-base font-medium text-black">
                    {t("checkout.total", "總計")}
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="text-xs text-[#707070]">
                      {currencyCode}
                    </span>
                    <span className="text-[22px] font-semibold text-black">
                      {symbol}
                      {grandTotal.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: { ...(await serverSideTranslations(locale || "zh-TW", ["common"])) },
  };
}
