const { messaging } = require('../config/firebaseAdmin');
const { supabaseAdmin } = require('../config/supabaseClient');

const sendNotification = async (phoneNumber, messageType, messageBody, additionalData = {}) => {
  let notificationLogId = null;

  try {
    const { data: notificationLog, error: logError } = await supabaseAdmin
      .from('notification_logs')
      .insert({
        phone_number: phoneNumber,
        message_type: messageType,
        message_body: messageBody,
        delivery_status: 'pending'
      })
      .select()
      .single();

    if (logError) throw logError;
    notificationLogId = notificationLog?.notification_id;

    if (messaging) {
      if (!phoneNumber || !phoneNumber.startsWith('+')) {
        throw new Error(`Invalid phone number format: ${phoneNumber}`);
      }

      // Send Firebase Cloud Messaging notification to the topic derived from the phone number.
      // Devices must subscribe to the topic `phone_<e164number_stripped>` on the client side.
      const topic = `phone_${phoneNumber.replace(/[^0-9]/g, '')}`;
      await messaging.send({
        topic,
        notification: {
          title: 'Extra-To-Essential',
          body: messageBody,
        },
        data: {
          messageType,
          ...Object.fromEntries(
            Object.entries(additionalData).map(([k, v]) => [k, String(v)])
          ),
        },
      });
    } else {
      console.warn('Firebase Messaging not configured. Skipping push notification.');
    }

    await supabaseAdmin
      .from('notification_logs')
      .update({
        delivery_status: 'sent',
        delivered_at: new Date().toISOString()
      })
      .eq('notification_id', notificationLogId);

    console.log(`Notification log created for ${phoneNumber}: ${messageType}`);

    return {
      success: true,
      notificationId: notificationLogId,
      message: 'Notification logged successfully'
    };

  } catch (error) {
    console.error('Notification error:', error.message);

    if (notificationLogId) {
      await supabaseAdmin
        .from('notification_logs')
        .update({
          delivery_status: 'failed',
          error_message: error.message
        })
        .eq('notification_id', notificationLogId);
    }

    return {
      success: false,
      error: error.message
    };
  }
};

const sendClaimAlert = async (donorPhone, ngoName, foodType) => {
  const message = `🎉 Good news! ${ngoName} has claimed your ${foodType} donation. They will coordinate pickup soon.`;
  return sendNotification(donorPhone, 'claim_alert', message);
};

const sendPickupAlert = async (donorPhone, ngoName, pickupTime) => {
  const message = `📦 ${ngoName} will pick up your donation at ${pickupTime}. Please have it ready!`;
  return sendNotification(donorPhone, 'pickup_alert', message);
};

const sendDeliveryAlert = async (ngoPhone, volunteerName, deliveryStatus) => {
  const statusMessages = {
    'assigned': `✅ ${volunteerName} has been assigned to the delivery.`,
    'in_transit': `🚚 ${volunteerName} is on the way with the food donation.`,
    'delivered': `✨ ${volunteerName} has successfully delivered the donation!`,
    'failed': `❌ Delivery by ${volunteerName} encountered an issue.`
  };

  const message = statusMessages[deliveryStatus] || 'Delivery status updated.';
  return sendNotification(ngoPhone, 'delivery_alert', message);
};

const sendExpiryWarning = async (donorPhone, foodType, hoursLeft) => {
  const message = `⚠️ Your ${foodType} listing will expire in ${hoursLeft} hours. Consider extending the time or reducing quantity if possible.`;
  return sendNotification(donorPhone, 'expiry_warning', message);
};

const sendCompletionNotice = async (recipientPhone, mealsServed, co2Reduced) => {
  const message = `🌟 Impact Update: ${mealsServed} meals served, ${co2Reduced.toFixed(2)} kg CO₂ saved! Thank you for making a difference.`;
  return sendNotification(recipientPhone, 'completion_notice', message);
};

const sendNewListingAlert = async (ngoPhone, foodType, quantity, distance) => {
  const message = `🍽️ New donation available: ${quantity} kg of ${foodType}, ${distance.toFixed(1)} km away. Claim it now!`;
  return sendNotification(ngoPhone, 'claim_alert', message);
};

const sendBulkNotifications = async (notifications) => {
  const results = await Promise.allSettled(
    notifications.map(notif =>
      sendNotification(notif.phone, notif.type, notif.message, notif.data)
    )
  );

  return {
    total: results.length,
    successful: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
    results
  };
};

const getNotificationLogs = async (filters = {}) => {
  let query = supabaseAdmin.from('notification_logs').select('*');

  if (filters.phoneNumber) {
    query = query.eq('phone_number', filters.phoneNumber);
  }

  if (filters.messageType) {
    query = query.eq('message_type', filters.messageType);
  }

  if (filters.deliveryStatus) {
    query = query.eq('delivery_status', filters.deliveryStatus);
  }

  if (filters.startDate) {
    query = query.gte('sent_at', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('sent_at', filters.endDate);
  }

  query = query.order('sent_at', { ascending: false }).limit(100);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
};

module.exports = {
  sendNotification,
  sendClaimAlert,
  sendPickupAlert,
  sendDeliveryAlert,
  sendExpiryWarning,
  sendCompletionNotice,
  sendNewListingAlert,
  sendBulkNotifications,
  getNotificationLogs
};