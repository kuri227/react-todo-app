export type LinkItem = {
    // リンクの識別子
    id: string; 
    // ユーザーが設定する説明（例: "GitHubリポジトリ", "実験手順書P5"）
    description: string; 
    // リンク先のURL
    url: string;
};

export type Todo = {
    id: string;
    name: string;
    isDone: boolean;
    priority: number;
    deadline: Date | null;
    isAllDay?: boolean; 
    subTodos?: Todo[];
    // ★ 追加: 参考資料を格納する配列
    links?: LinkItem[]; 
};