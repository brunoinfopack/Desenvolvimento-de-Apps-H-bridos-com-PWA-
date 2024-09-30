'use client';

import PrivateRoute from '@/components/PrivateRoute';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { addTaskToFirestore, getTasksFromFirestore, analyticsInit } from '../../public/utils/firebase';
import { addTask, getTasks } from '../../public/utils/indexedDb';

const requestNotificationPermission = () => {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        sendNotification('Notificações ativadas', 'Agora você receberá notificações.');
      }
    });
  }
};

const sendNotification = (title, body) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [completed, setCompleted] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const today = format(new Date(), 'yyyy-MM-dd');

  const loadTasks = async () => {
    try {
      const tasksFromDB = await getTasks();

      if (navigator.onLine) {
        const tasksFromFirestore = await getTasksFromFirestore();

        const tasksMap = new Map();
        tasksFromDB.forEach(task => tasksMap.set(task.id, task));
        tasksFromFirestore.forEach(task => {
          const exists = tasksMap.has(task.id) || tasksMap.has(Date.now());
          if (!exists) {
            tasksMap.set(task.id, task);
          }
        });

        const mergedTasks = Array.from(tasksMap.values());
        await Promise.all(
          mergedTasks.map(async (task) => {
            try {
              if (!task.synced) {
                await addTaskToFirestore(task);
                task.synced = true;
              }
              await addTask(task);
            } catch (error) {
              console.error('Erro ao adicionar tarefa durante a sincronização:', error);
            }
          })
        );

        setTasks(mergedTasks);
      } else {
        setTasks(tasksFromDB);
      }
    } catch (error) {
      console.error('Erro ao carregar e mesclar tarefas:', error);
    }
  };

  useEffect(() => {
    requestNotificationPermission();
    loadTasks();

    const handleOfflineStatus = () => {
      if (!navigator.onLine) {
        setIsOffline(true);
        sendNotification('Você está offline', 'As tarefas adicionadas serão sincronizadas quando a conexão for restaurada.');
      } else {
        setIsOffline(false);
        sendNotification('Você está online', 'A conexão foi restabelecida.');
        loadTasks();
      }
    };

    window.addEventListener('online', handleOfflineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    const loadAnalytics = async () => {
      await analyticsInit();
    }
    if (typeof window !== 'undefined') {
      loadAnalytics();
    }

    return () => {
      window.removeEventListener('online', handleOfflineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();

    const newTask = {
      id: Date.now(),
      title,
      date: new Date(dateTime).toISOString(),
      completed,
      synced: navigator.onLine,
    };

    try {
      if (navigator.onLine) {
        const tasksFromFirestore = await getTasksFromFirestore();
        const exists = tasksFromFirestore.some(task => task.title === newTask.title && task.date === newTask.date && task.completed === newTask.completed);

        if (!exists) {
          await addTaskToFirestore(newTask);
        }
      }
      await addTask(newTask);
      loadTasks();
    } catch (error) {
      console.error('Erro ao adicionar nova tarefa:', error);
    }

    setTitle('');
    setDateTime('');
    setCompleted(false);
  };

  const groupByDate = (tasks) => {
    const grouped = tasks.reduce((groups, task) => {
      const taskDate = parseISO(task.date);
      const formattedDate = format(taskDate, 'yyyy-MM-dd');

      const displayDate = formattedDate >= today ? formattedDate : 'passadas';

      if (!groups[displayDate]) {
        groups[displayDate] = [];
      }
      groups[displayDate].push(task);
      return groups;
    }, {});

    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });
    });

    return grouped;
  };

  const groupedTasks = groupByDate(tasks);

  return (
    <PrivateRoute>
      <div className="container mx-auto min-h-screen p-6 bg-gradient-to-br from-gray-100 to-gray-300">
        <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl p-8">
          <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-10 tracking-tight">
            Minhas Tarefas
          </h1>
  
          {/* Offline Notification */}
          {isOffline && (
            <div className="bg-yellow-500 text-yellow-900 p-4 rounded-lg mb-6 text-center font-semibold">
              Você está offline! As tarefas serão sincronizadas assim que a conexão for restaurada.
            </div>
          )}
  
          {/* Task Input Form */}
          <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <input
              type="text"
              placeholder="Título da Tarefa"
              className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              className="border border-gray-300 p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200 w-full"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              required
            />
            <label className="flex items-center space-x-3 md:col-span-2">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-green-600"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
              />
              <span className="text-gray-800">Completo</span>
            </label>
            <button
              className="col-span-1 md:col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 w-full"
              type="submit"
            >
              Adicionar Tarefa
            </button>
          </form>
  
          {/* Task Display */}
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Tarefas Atuais</h2>
            {Object.keys(groupedTasks)
              .filter((date) => date !== 'passadas')
              .map((date) => (
                <div key={date} className="mb-6 bg-gray-50 shadow-md rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-700 mb-4">
                    {date === today ? 'Hoje' : format(parseISO(date), 'dd/MM/yyyy')}
                  </h3>
                  <ul>
                    {groupedTasks[date].map((task) => (
                      <li
                        key={task.id}
                        className={`flex justify-between items-center p-4 mb-4 rounded-lg transition duration-200 ${task.completed
                          ? 'bg-green-50 border-l-4 border-green-500'
                          : 'bg-red-50 border-l-4 border-red-500'
                          }`}
                      >
                        <span className="text-gray-800">
                          <strong>{task.title}</strong> - {format(new Date(task.date), 'HH:mm')} -{' '}
                          {task.completed ? (
                            <span className="text-green-600">Concluída</span>
                          ) : (
                            <span className="text-red-600">Não Concluída</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
  
          {/* Past Tasks */}
          <div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-6">Tarefas Passadas</h2>
            <ul>
              {groupedTasks['passadas']?.map((task) => (
                <li
                  key={task.id}
                  className={`flex justify-between items-center p-4 mb-4 rounded-lg bg-gray-200 ${task.completed ? 'text-gray-700' : 'text-gray-500'
                    }`}
                >
                  <span>
                    <strong>{task.title}</strong> - {format(new Date(task.date), 'HH:mm')} em{' '}
                    {format(parseISO(task.date), 'dd/MM/yyyy')} -{' '}
                    {task.completed ? (
                      <span className="text-green-600">Concluída</span>
                    ) : (
                      <span className="text-red-600">Não Concluída</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PrivateRoute>
  );
}