import { db } from './firebase';

export interface EmailSettings {
  orderSubject: string;
  orderBody: string;
  abandonedSubject: string;
  abandonedBody: string;
  shippedSubject: string;
  shippedBody: string;
}

export const defaultEmailSettings: EmailSettings = {
  orderSubject: '¡Gracias por tu compra en FlexForm Fitness! 🎉',
  orderBody: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <h1 style="color: #e11d48; margin-bottom: 20px;">¡Gracias por tu compra, {{customerName}}!</h1>
  <p style="color: #334155; line-height: 1.6;">Hemos recibido tu pedido correctamente. A continuación, tienes los detalles de tu compra:</p>
  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>ID del Pedido:</strong> {{orderId}}</p>
    <p style="margin: 0 0 10px 0;"><strong>Total Pagado:</strong> {{totalAmount}}</p>
  </div>
  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">Resumen del Pedido</h3>
  {{orderItems}}
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
    {{invoiceUrl}}
    <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Te enviaremos un correo de confirmación con el código de seguimiento una vez que tu pedido sea enviado.</p>
  </div>
</div>`,
  abandonedSubject: '¿Te has olvidado algo? Tu carrito te espera 🛒',
  abandonedBody: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <h1 style="color: #0f172a; margin-bottom: 20px;">Hola {{customerName}},</h1>
  <p style="color: #334155; line-height: 1.6;">Vimos que dejaste algunos artículos en tu carrito de FlexForm Fitness. ¡Aún estás a tiempo de conseguirlos!</p>
  
  <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px;">Tu Carrito</h3>
  {{orderItems}}
  
  <div style="margin: 30px 0; text-align: center;">
    <a href="{{recoveryUrl}}" style="display: inline-block; padding: 12px 28px; background-color: #e11d48; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Completar mi Compra</a>
  </div>
  
  <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #64748b; font-size: 12px;">
    <p>Si tienes alguna pregunta o necesitas ayuda, responde directamente a este correo.</p>
  </div>
</div>`,
  shippedSubject: '¡Tu pedido ha sido enviado! 🚚 - FlexForm Fitness',
  shippedBody: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
  <h1 style="color: #e11d48; margin-bottom: 20px;">¡Tu pedido está en camino! 🚚</h1>
  <p style="color: #334155; line-height: 1.6;">Hola {{customerName}}, nos complace informarte que tu pedido <strong>{{orderId}}</strong> ha sido enviado y está en camino.</p>
  
  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0;"><strong>Código de Seguimiento:</strong> {{trackingNumber}}</p>
    <p style="margin: 0 0 10px 0;"><strong>Enlace de Seguimiento:</strong> <a href="{{trackingUrl}}" target="_blank" style="color: #e11d48; font-weight: bold; text-decoration: underline;">Seguir mi pedido</a></p>
  </div>
  
  <p style="color: #334155; line-height: 1.6;">Agradecemos tu confianza en FlexForm Fitness. Si tienes cualquier consulta, responde a este correo.</p>
</div>`,
};

export async function getEmailSettings(): Promise<EmailSettings> {
  try {
    const doc = await db.collection('settings').doc('email').get();
    if (doc.exists) {
      const data = doc.data() as Partial<EmailSettings>;
      return {
        orderSubject: data.orderSubject || defaultEmailSettings.orderSubject,
        orderBody: data.orderBody || defaultEmailSettings.orderBody,
        abandonedSubject: data.abandonedSubject || defaultEmailSettings.abandonedSubject,
        abandonedBody: data.abandonedBody || defaultEmailSettings.abandonedBody,
        shippedSubject: data.shippedSubject || defaultEmailSettings.shippedSubject,
        shippedBody: data.shippedBody || defaultEmailSettings.shippedBody,
      };
    }
  } catch (error) {
    console.error('Error fetching email settings:', error);
  }
  return defaultEmailSettings;
}
