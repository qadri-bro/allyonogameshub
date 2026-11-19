import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTelegram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";

function Contact() {
  return (
    <main className="page-wrapper mt-5 contact-page pb-0">
      <header className="contact-heading">
        <p className="contact-eyebrow">WE'RE HERE TO HELP</p>
        <h1>Contact Us</h1>
        <p>Connect with us through our official social channels for updates and information.</p>
      </header>

      <section className="contact-socials" aria-label="Our social channels">
        <article className="contact-social-card">
          <FontAwesomeIcon className="contact-social-icon telegram" icon={faTelegram} aria-hidden="true" />
          <div className="contact-social-copy">
            <h2>Telegram Channel</h2>
            <p>Join our Telegram channel for updates.</p>
          </div>
          <a href="https://t.me/+LwPVvmqqpDdiMTY1" target="_blank" rel="noopener noreferrer">
            Join Telegram
          </a>
        </article>

        <article className="contact-social-card">
          <FontAwesomeIcon className="contact-social-icon whatsapp" icon={faWhatsapp} aria-hidden="true" />
          <div className="contact-social-copy">
            <h2>WhatsApp Channel</h2>
            <p>Follow our WhatsApp channel for updates.</p>
          </div>
          <a href="https://whatsapp.com/channel/0029VaeYMKrL7UVOat4ZSW3r" target="_blank" rel="noopener noreferrer">
            Join WhatsApp
          </a>
        </article>
      </section>

      <p className="contact-safety-note">
        These are update channels, not private support chats. Never share your password, OTP, or UPI PIN.
      </p>
    </main>
  );
}

export default Contact;