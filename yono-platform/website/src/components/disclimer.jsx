
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Link } from "react-router-dom";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";


const Disclaimers = () => {
  return ( 
        
           <section className="section mb-0">
            <div className="red-disclaimer-box">
                <div className="centerio">
                <FontAwesomeIcon icon={faTriangleExclamation} /> Important Notice
                </div>
                <p>
                <strong>YonoGames.com.in</strong> does not run, manage or own any of the
                apps listed here. We only provide information that is already publicly
                available. Real-money Rummy, Teen Patti, slots and similar games can be{" "}
                <strong>financially risky</strong> and may lead to losses. Use all such
                apps very carefully and entirely at your own responsibility.
                </p>
                <p>
                This website is meant only for users who are{" "}
                <strong>18+ years old</strong>. Please read our
                <strong>
                    <Link to="/disclaimer">Disclaimer page</Link>
                </strong>{" "}
                and the disclaimer or terms section of each individual app before playing.
                </p>
                <p>
                <strong>India-wide notice:</strong> The national online gaming law
                prohibits online money games, their promotion and related fund transfers
                across India. A state list alone is not a complete guide to what is
                allowed. Check the latest official law and notices on the
                <a
                    href="https://www.meity.gov.in/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Ministry website
                </a>
                before relying on any listing.
                </p>
                <p>
                <span className="centerio1">Alert:</span> Rummy and similar real-money
                games are commonly reported as banned or restricted in
                <strong>
                    Andhra Pradesh, Sikkim, Nagaland, Assam, Arunachal Pradesh, Tamil Nadu,
                    Odisha and Telangana
                </strong>
                . If you are from any such region, avoid using these apps. Always follow
                your local laws and regulations.
                </p>
            </div>
            </section>
  );
};

export default Disclaimers;
