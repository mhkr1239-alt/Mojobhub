import React, { useEffect, useState } from 'react';
import { Bell, BellRing, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Base64URL VAPID public key as instructed
const VAPID_PUBLIC_KEY = 'BODyhokE54oWhYbft1vE-w5BTFu6KQAgQvZUg4aEAIPuqHTzeDjb1tTaQrA_Mt1C-3wg-az-VfGVfvTfv9Ib9-U';

// Utility to convert base64url to Uint8Array for pushManager.subscribe
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const AdminPushNotificationOptIn: React.FC = () => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkSubscription() {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
          if (isMounted) {
            setIsSupported(false);
            setLoading(false);
          }
          return;
        }

        // Check if service worker is registered and has existing push subscription
        const registration = await navigator.serviceWorker.getRegistration('/service-worker.js');
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (isMounted) {
            setIsSubscribed(!!subscription);
          }
        } else {
          // Check any active registration
          const readyReg = await navigator.serviceWorker.ready.catch(() => null);
          if (readyReg) {
            const subscription = await readyReg.pushManager.getSubscription();
            if (isMounted) {
              setIsSubscribed(!!subscription);
            }
          }
        }
      } catch (err) {
        console.error('Error checking push subscription:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = async () => {
    setFeedback(null);
    setActionLoading(true);

    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('متصفحك الحالي لا يدعم الإشعارات الفورية (Push Notifications).');
      }

      // Step 1: Register Service Worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      await navigator.serviceWorker.ready;

      // Step 2: Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('تم رفض إذن الإشعارات من المتصفح. يرجى تفعيل الإذن من إعدادات المتصفح.');
      }

      // Step 3: Convert key and subscribe
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource
      });

      if (!subscription) {
        throw new Error('تعذر إنشاء اشتراك الإشعارات، يرجى المحاولة لاحقاً.');
      }

      // Step 4: Upsert / insert into push_subscriptions table in Supabase
      const subscriptionPayload = JSON.parse(JSON.stringify(subscription));
      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .insert({
          subscription: subscriptionPayload
        });

      if (dbError) {
        console.error('Supabase error inserting push subscription:', dbError);
        throw new Error(dbError.message || 'حدث خطأ أثناء حفظ الاشتراك في قاعدة البيانات.');
      }

      setIsSubscribed(true);
      setFeedback({
        type: 'success',
        message: 'تم تفعيل الإشعارات بنجاح ✅'
      });
    } catch (err: any) {
      console.error('Subscription error:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'فشل تفعيل الإشعارات، يرجى المحاولة مرة أخرى.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/30 cursor-default opacity-90 shrink-0"
            title="الإشعارات الفورية مفعّلة في هذا المتصفح"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>الإشعارات مفعّلة ✅</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading || actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#E6EDF2] bg-[#1A232C] hover:bg-[#232F3A] hover:text-[#1FA98A] border border-[#232F3A] hover:border-[#1FA98A]/40 transition cursor-pointer disabled:opacity-50 shrink-0"
            title="تفعيل استلام الإشعارات الفورية عند وصول طلبات جديدة"
          >
            {actionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1FA98A]" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-[#1FA98A]" />
            )}
            <span>{actionLoading ? 'جاري التفعيل...' : 'تفعيل الإشعارات'}</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`text-[11px] font-medium flex items-center gap-1.5 px-2.5 py-1 rounded-md max-w-xs transition-all ${
            feedback.type === 'success'
              ? 'text-[#1FA98A] bg-[#1FA98A]/10 border border-[#1FA98A]/20'
              : 'text-[#E1615E] bg-[#E1615E]/10 border border-[#E1615E]/20'
          }`}
        >
          {feedback.type === 'success' ? (
            <BellRing className="w-3 h-3 shrink-0" />
          ) : (
            <AlertCircle className="w-3 h-3 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
};
