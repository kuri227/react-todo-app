import React from "react";

// 引数の型を定義
// Propsという名前で定義することが一般的です。
type Props = {
  name: string;
  uncompletedCount : number;
};

// WelcomeMessage という関数コンポーネントの定義
// 関数コンポーネントはパスカルケースで名前を設定します。
const WelcomeMessage = (props: Props) => {
  // いわゆる普通のロジックを記述する
  const greeting = "お疲れ様です"
  const str = props.uncompletedCount ? `未完了のタスクが${props.uncompletedCount}個あります。` : "";

  //【重要!】JSX構文で描いた「JSX要素」を return で返す
  return (
    <div className="flex items-center bg-blue-50 p-3 rounded-lg"> {/* ★ 背景色と角丸を追加 */}
      <div className="text-blue-700 font-medium">
        {greeting}、{props.name}さん。
      </div>
      <div className="px-2 font-extrabold text-red-600">
        {str}
      </div>
    </div>
  );
};

// 他のファイルで WelcomeMessage を import できるようにする
export default WelcomeMessage;