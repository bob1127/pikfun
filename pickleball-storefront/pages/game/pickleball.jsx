import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

// Canvas 遊戲不能 SSR
const PickleballGame = dynamic(
  () => import("../../components/game/PickleballGame"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#071628] flex items-center justify-center">
        <div className="text-white/40 text-sm">載入中...</div>
      </div>
    ),
  },
);

export default function PickleballGamePage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>匹克球對戰遊戲 | PikFun</title>
        <meta
          name="description"
          content="即時 2D 匹克球對戰遊戲，學習廚房區規則與計分方式"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      <div className="min-h-screen bg-[#071628] flex flex-col items-center justify-start overflow-x-hidden">
        <PickleballGame onBack={() => router.back()} />
      </div>
    </>
  );
}
