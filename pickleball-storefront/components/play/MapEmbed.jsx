import { DollarSign, Wallet } from "lucide-react";
import { buildGoogleMapsEmbedUrl } from "@/lib/playUtils";

export default function MapEmbed({ locationName, locationAddress, className = "" }) {
  const src = buildGoogleMapsEmbedUrl(locationName, locationAddress);
  if (!src) return null;

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 ${className}`}>
      <iframe
        title={`${locationName} 地圖`}
        src={src}
        width="100%"
        height="280"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full"
      />
    </div>
  );
}

export function FeePaymentBlock({ session, compact = false }) {
  const fee = session.fee_per_person ?? 0;
  const isFree = fee === 0 || session.payment_method === "free";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center gap-3 text-gray-700">
        <DollarSign size={18} className="text-[#FFD43A] shrink-0" />
        <span>
          {isFree ? (
            <span className="font-bold text-green-600">免費</span>
          ) : (
            <>
              每人{" "}
              <span className="font-bold text-black text-lg">
                NT$ {Number(fee).toLocaleString()}
              </span>
            </>
          )}
        </span>
      </div>
      {!isFree && session.payment_method && (
        <div className="flex items-start gap-3 text-gray-700">
          <Wallet size={18} className="text-[#3157B5] shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-black">
              {session.payment_method_label ||
                session.payment_method}
            </p>
            {session.payment_note && (
              <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">
                {session.payment_note}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
