/**
 * Payment Gateway utilities.
 * Handles gateway HTML injection, script evaluation, and form auto-submission.
 */

/**
 * Renders raw HTML returned from a payment gateway into the DOM.
 * Extracts and runs any inline or external <script> tags sequentially,
 * and submits any payment form included in the markup.
 */
export async function renderPaymentGatewayHTML(html: string): Promise<void> {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  const scripts = Array.from(container.querySelectorAll('script'));

  for (const oldScript of scripts) {
    const newScript = document.createElement('script');

    // Copy attributes (src, async, type, etc.)
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });

    if (oldScript.src) {
      // External script: wait until loaded before proceeding
      await new Promise<void>((resolve, reject) => {
        newScript.onload = () => resolve();
        newScript.onerror = () => reject(new Error(`Failed to load script: ${oldScript.src}`));

        document.head.appendChild(newScript);
      });
    } else {
      // Inline script
      newScript.textContent = oldScript.textContent;
      document.body.appendChild(newScript);
    }

    oldScript.remove();
  }

  // Submit form if present in the gateway payload
  const form = container.querySelector<HTMLFormElement>('form');
  if (form) {
    form.submit();
  }
}
