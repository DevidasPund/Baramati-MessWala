import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  Megaphone,
} from 'lucide-react';
import api from '../../services/api';

export const CustomerNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default rich Marathi notifications for Baramati Messwala members
  const defaultNotifs = [
    {
      id: 'notif-1',
      title: 'मेस जेवणाच्या वेळेत थोडा बदल',
      message: 'सर्व ग्राहकांना कळवण्यात येते की रविवारच्या दिवशी दुपारचे जेवण १२:०० ते ३:३० पर्यंत सुरू राहील.',
      type: 'INFO',
      date: 'आज, दुपारी १:००',
      read: true,
    },
    {
      id: 'notif-2',
      title: 'रविवार स्पेशल मेनू: पुरणपोळी व कटाची आमटी',
      message: 'येत्या रविवारी बारामती मेसवाला तर्फे सर्व सदस्यांसाठी गरमागरम पुरणपोळीची मेजवानी आयोजित केली आहे.',
      type: 'ANNOUNCEMENT',
      date: 'काल, संध्याकाळी ६:३०',
      read: true,
    },
    {
      id: 'notif-3',
      title: 'मासिक सबस्क्रिप्शन पेमेंट स्मरणपत्र',
      message: 'ज्या सदस्यांचे चालू महिन्याचे पेमेंट बाकी आहे त्यांनी कृपया ॲपमधील UPI (बारामतीचा डबेवाला) द्वारे वेळेवर जमा करावे.',
      type: 'ALERT',
      date: '३ दिवसांपूर्वी',
      read: false,
    },
    {
      id: 'notif-4',
      title: 'मेस बंद / सुट्टीची नोंद',
      message: 'गावी जाताना कृपया ॲपमधून किमान २४ तास आधी रजेची विनंती पाठवा, जेणेकरून अन्नाची नासाडी टळेल.',
      type: 'NOTICE',
      date: '५ दिवसांपूर्वी',
      read: true,
    },
  ];

  useEffect(() => {
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/notifications/my');
        if (res?.data?.notifications && res.data.notifications.length > 0) {
          setNotifications(res.data.notifications);
        } else {
          setNotifications(defaultNotifs);
        }
      } catch (err) {
        setNotifications(defaultNotifs);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifs();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'ALERT':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-5 h-5 text-purple-500" />;
      case 'NOTICE':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          <span>मेस सूचना व घोषणा (Notifications)</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          बारामती मेसवाला कडून महत्त्वाच्या सूचना, सुट्ट्या आणि मेनू अपडेट्स
        </p>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              item.read
                ? 'bg-white border-slate-200/90 shadow-2xs'
                : 'bg-blue-50/50 border-blue-200 shadow-xs'
            } flex items-start gap-4`}
          >
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
              {getIcon(item.type)}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {item.title}
                </h3>
                <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                  {item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString('mr-IN') : '')}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {item.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
