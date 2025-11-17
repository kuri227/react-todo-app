import { useState, useEffect } from "react";
import type { Todo } from "./types";
import type { LinkItem } from "./types";
import { initTodos } from "./initTodos";
import WelcomeMessage from "./WelcomeMessage";
import TodoList from "./TodoList";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge"; // ◀◀ 追加
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // ◀◀ 追加
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons"; // ◀◀ 追加
import { DragDropContext } from '@hello-pangea/dnd';
import type { DropResult } from "@hello-pangea/dnd";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const App = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoName, setNewTodoName] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState(3);
  const [newTodoDeadline, setNewTodoDeadline] = useState<Date | null>(null);
  const [newTodoIsAllDay, setNewTodoIsAllDay] = useState(false);
  const [newTodoNameError, setNewTodoNameError] = useState("");

  const [initialized, setInitialized] = useState(false); // ◀◀ 追加
  const localStorageKey = "TodoApp"; // ◀◀ 追加

  // App コンポーネントの初回実行時のみLocalStorageからTodoデータを復元
  useEffect(() => {
    const todoJsonStr = localStorage.getItem(localStorageKey);
    if (todoJsonStr && todoJsonStr !== "[]") {
      const storedTodos: Todo[] = JSON.parse(todoJsonStr);
      const convertedTodos = storedTodos.map((todo) => ({
        ...todo,
        deadline: todo.deadline ? new Date(todo.deadline) : null,
      }));
      setTodos(convertedTodos);
    } else {
      // LocalStorage にデータがない場合は initTodos をセットする
      setTodos(initTodos);
    }
    setInitialized(true);
  }, []);

  // 状態 todos または initialized に変更があったときTodoデータを保存
  useEffect(() => {
    if (initialized) {
      localStorage.setItem(localStorageKey, JSON.stringify(todos));
    }
  }, [todos, initialized]);

  const uncompletedCount = todos.filter((todo: Todo) => !todo.isDone).length;

  // ▼▼ 追加
  const isValidTodoName = (name: string): string => {
    if (name.length < 2 || name.length > 32) {
      return "2文字以上、32文字以内で入力してください";
    } else {
      return "";
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // --- 1. メインのTodoリストでの並び替え (親タスク) ---
    if (source.droppableId === 'main-todo-list' && destination.droppableId === 'main-todo-list') {
        const items = Array.from(todos);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        setTodos(items);
        return; // 処理終了
    }

    // --- 2. サブタスクリスト内での並び替え ---
    // DroppableIdが 'subtask-PARENT_ID' の形式であることを利用
    if (destination.droppableId.startsWith('subtask-')) {
        const parentId = destination.droppableId.replace('subtask-', '');
        const todoIndex = todos.findIndex(t => t.id === parentId);
        
        // 親タスクが存在しない場合は何もしない
        if (todoIndex === -1 || !todos[todoIndex].subTodos) return;
        
        const parentTodo = todos[todoIndex];
        const subTodos = Array.from(parentTodo.subTodos || []);
        
        // サブタスクの並び替え
        const [reorderedSubItem] = subTodos.splice(source.index, 1);
        subTodos.splice(destination.index, 0, reorderedSubItem);

        // stateをイミュータブルに更新
        const newTodos = todos.map((todo, index) => {
            if (index === todoIndex) {
                return {
                    ...todo,
                    subTodos: subTodos
                };
            }
            return todo;
        });

        setTodos(newTodos);
        return; // 処理終了
    }
  };

  // サブタスク管理
  // サブタスクの追加
  const addSubTodo = (parentId: string, name: string, deadline: Date | null, isAllDay: boolean) => {
    const newSubTodo: Todo = {
      id: uuid(),
      name: name,
      isDone: false,
      priority: 3,
      deadline: deadline,
      isAllDay: isAllDay,
      subTodos: [],
    };

    const updatedTodos = todos.map(todo => {
      if (todo.id == parentId){
        return {
          ...todo,
          subTodos: [...(todo.subTodos || []), newSubTodo],
        };
      }
      return todo;
    });
    setTodos(updatedTodos);
  }

  // サブタスクの完了状態更新
  const updateSubTodoIsDone = (parentId: string, subId: string, value: boolean) => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === parentId && todo.subTodos) {
        const updatedSubTodos = todo.subTodos.map(sub => {
          if(sub.id === subId) {
            return {...sub, isDone: value };
          }
          return sub;
        });
        return {...todo, subTodos: updatedSubTodos };
      }
      return todo;
    });
    setTodos(updatedTodos);
  };

  // サブタスクの削除
  const removeSubTodo = (parentId: string, subId: string) => {
    const updatedTodos = todos.map(todo => {
      if (todo.id === parentId && todo.subTodos) {
        const updatedSubTodos = todo.subTodos.filter(sub => sub.id !== subId);
        return {...todo, subTodos: updatedSubTodos};
      }
      return todo;
    });
    setTodos(updatedTodos);
  };

  const updateNewTodoName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodoNameError(isValidTodoName(e.target.value)); // ◀◀ 追加
    setNewTodoName(e.target.value);
  };

  const updateNewTodoPriority = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTodoPriority(Number(e.target.value));
  };

  const remove = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);
  };

  const updateIsDone = (id: string, value: boolean) => {
    const updatedTodos = todos.map((todo) => {
    if (todo.id === id) {
      return { ...todo, isDone: value }; // スプレッド構文
    } else {
      return todo;
    }
    });
    setTodos(updatedTodos);
  };

  const removeCompletedTodos = () => {
    const updatedTodos = todos.filter((todo) => !todo.isDone);
    setTodos(updatedTodos);
  };

  // ★ リンク操作のコアロジック (追加と削除)

  // 1. リンクの追加
  const addLink = (todoId: string, description: string, url: string) => {
      const newLink: LinkItem = {
          id: uuid(),
          description: description,
          url: url,
      };

      const updatedTodos = todos.map(todo => {
        if (todo.id === todoId) {
          return {
                  ...todo,
                  links: [...(todo.links || []), newLink], // 既存のリンクに新しいリンクを追加
                  };
            }
            return todo;
        });
        setTodos(updatedTodos);
    };

    // 2. リンクの削除
    const removeLink = (todoId: string, linkId: string) => {
        const updatedTodos = todos.map(todo => {
            if (todo.id === todoId && todo.links) {
                const updatedLinks = todo.links.filter(link => link.id !== linkId);
                return {
                    ...todo,
                    links: updatedLinks,
                };
            }
            return todo;
        });
        setTodos(updatedTodos);
    };



  const addNewTodo = () => {
    const err = isValidTodoName(newTodoName);
    if (err !== "") {
      setNewTodoNameError(err);
      return;
    }
    const newTodo: Todo = {
      id: uuid(),
      name: newTodoName,
      isDone: false,
      priority: newTodoPriority,
      deadline: newTodoDeadline,
      isAllDay: newTodoIsAllDay, 
      subTodos: [],
      links: [],
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    setNewTodoName("");
    setNewTodoPriority(3);
    setNewTodoDeadline(null);
    setNewTodoIsAllDay(false);
  };

  return (
    <div className="mx-4 mt-10 max-w-2xl md:mx-auto">
      <h1 className="mb-6 text-3xl font-extrabold">着手促進 Todo</h1>
      <div className="mb-6 border-b pb-4 border-gray-200">
        <WelcomeMessage
          name="User"
          uncompletedCount={uncompletedCount}
        />
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <TodoList todos={todos} 
        updateIsDone={updateIsDone} 
        remove={remove} 
        addSubTodo={addSubTodo} 
        updateSubTodoIsDone={updateSubTodoIsDone} 
        removeSubTodo={removeSubTodo}
        addLink={addLink}
        removeLink={removeLink}
        />
      </DragDropContext>

      <button
      type="button"
      onClick={removeCompletedTodos}
      className={"mt-5 rounded-md bg-red-500 px-3 py-1 font-bold text-white hover:bg-red-600"}
      >
      完了済みのタスクを削除
      </button>

      <div className="mt-5 space-y-2 rounded-md border p-3 bg-gray-50">
        <h2 className="text-lg font-bold">新しいタスクの追加</h2>
        {/* 編集: ここから... */}
        <div>
          <div className="flex items-center space-x-2">
            <label className="font-bold" htmlFor="newTodoName">
              名前
            </label>
            <input
              id="newTodoName"
              type="text"
              value={newTodoName}
              onChange={updateNewTodoName}
              className={twMerge(
                "grow rounded-md border p-2",
                newTodoNameError && "border-red-500 outline-red-500"
              )}
              placeholder="2文字以上、32文字以内で入力してください"
            />
          </div>
          {newTodoNameError && (
            <div className="ml-10 flex items-center space-x-1 text-sm font-bold text-red-500">
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                className="mr-0.5"
              />
              <div>{newTodoNameError}</div>
            </div>
          )}
        </div>
        {/* ...ここまで */}

        <div className="flex gap-5">
          <div className="font-bold">優先度</div>
          {[1, 2, 3].map((value) => (
            <label key={value} className="flex items-center space-x-1">
              <input
                id={`priority-${value}`}
                name="priorityGroup"
                type="radio"
                value={value}
                checked={newTodoPriority === value}
                onChange={updateNewTodoPriority}
              />
              <span>{value}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-x-4">
          <label htmlFor="deadline" className="font-bold">
            期限
          </label>
          <DatePicker
                    selected={newTodoDeadline}
                    onChange={(date: Date | null) => setNewTodoDeadline(date)}
                    showTimeSelect={!newTodoIsAllDay} // 終日ではない場合のみ時間を選択
                    timeFormat="HH:mm"
                    dateFormat={newTodoIsAllDay ? "yyyy/MM/dd" : "yyyy/MM/dd HH:mm"}
                    timeIntervals={30}
                    isClearable
                    placeholderText="期限を設定"
                    className="rounded-md border border-gray-400 px-2 py-0.5"
                />

                <label className="flex items-center space-x-1">
                    <input
                        type="checkbox"
                        checked={newTodoIsAllDay}
                        onChange={(e) => setNewTodoIsAllDay(e.target.checked)}
                    />
                    <span>終日タスク</span>
                </label>
        </div>

        <button
          type="button"
          onClick={addNewTodo}
          className={twMerge(
            "rounded-md bg-indigo-500 px-3 py-1 font-bold text-white hover:bg-indigo-600",
            newTodoNameError && "cursor-not-allowed opacity-50"
          )}
        >
          追加
        </button>
      </div>
    </div>
  );
};

export default App;