
    let currentState = "waiting_card";
    let currentBalance = 10000.00;
    let enteredPin = "";
    let cardInserted = false;
    let authenticated = false;
    const CORRECT_PIN = "1234";
    
    let pendingTransactionType = null;
    let amountInputValue = "";

    const balanceLabel = document.getElementById("balanceLabel");
    const dynamicMessageDiv = document.getElementById("dynamicMessage");
    const pinDisplaySpan = document.getElementById("pinDisplay");
    const optionsMenuDiv = document.getElementById("optionsMenu");
    const actionMenuDiv = document.getElementById("actionMenu");
    const amountInputArea = document.getElementById("amountInputArea");

    // POPUP FUNCTION
    function showPopup(type, amount, balance, customMessage = null) {
        // Remove existing popup if any
        const existingPopup = document.querySelector('.popup-overlay');
        if (existingPopup) existingPopup.remove();
        
        const popup = document.createElement('div');
        popup.className = 'popup-overlay';
        
        let icon = '';
        let title = '';
        let amountHtml = '';
        let messageHtml = '';
        let isError = (type === 'error');
        
        if (type === 'withdraw') {
            icon = '💰💵💰';
            title = 'CASH DISPENSED!';
            amountHtml = `<div class="popup-amount">- ₹ ${amount.toLocaleString()}</div>`;
            messageHtml = `<div class="popup-message">Please take your cash from the dispenser.<br>Thank you for using NEO Bank!</div>`;
        } else if (type === 'deposit') {
            icon = '📥💵📥';
            title = 'DEPOSIT SUCCESSFUL!';
            amountHtml = `<div class="popup-amount">+ ₹ ${amount.toLocaleString()}</div>`;
            messageHtml = `<div class="popup-message">Your deposit has been processed successfully.<br>Funds are now available in your account.</div>`;
        } else if (type === 'error') {
            icon = '⚠️❌⚠️';
            title = 'TRANSACTION FAILED';
            amountHtml = `<div class="popup-amount" style="color:#ff6666;">₹ ${amount.toLocaleString()}</div>`;
            messageHtml = `<div class="popup-message">${customMessage || 'Transaction could not be completed.'}<br>Please try again.</div>`;
        }
        
        popup.innerHTML = `
            <div class="popup-container ${isError ? 'popup-error' : ''}">
                <div class="popup-icon">${icon}</div>
                <div class="popup-title">${title}</div>
                ${amountHtml}
                <div class="popup-balance">💰 New Balance: ₹ ${balance.toLocaleString()}</div>
                ${messageHtml}
                <button class="popup-button" onclick="this.closest('.popup-overlay').remove()">✓ CONTINUE</button>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // Auto close after 4 seconds if not clicked
        setTimeout(() => {
            const stillPopup = document.querySelector('.popup-overlay');
            if (stillPopup) stillPopup.remove();
        }, 4000);
    }

    function refreshUI() {
        if (authenticated && cardInserted && currentState === "menu") {
            balanceLabel.innerHTML = `💰 BALANCE: ₹ ${currentBalance.toFixed(2)} 💰`;
        } else {
            balanceLabel.innerHTML = `🏦 NEO BANK • Welcome 🏦`;
        }

        if (currentState === "waiting_card") {
            dynamicMessageDiv.innerHTML = "💳 Please insert your card using INSERT CARD button 💳";
            pinDisplaySpan.style.display = "block";
            pinDisplaySpan.innerHTML = "⚬ ⚬ ⚬ ⚬";
            optionsMenuDiv.innerHTML = "";
            actionMenuDiv.innerHTML = "";
            amountInputArea.style.display = "none";
            enteredPin = "";
        }
        else if (currentState === "pin_entry") {
            dynamicMessageDiv.innerHTML = "🔐 ENTER YOUR 4-DIGIT PIN on keypad 🔐";
            pinDisplaySpan.style.display = "block";
            let masked = "";
            for (let i = 0; i < enteredPin.length; i++) masked += "● ";
            for (let i = enteredPin.length; i < 4; i++) masked += "⚬ ";
            pinDisplaySpan.innerHTML = masked;
            optionsMenuDiv.innerHTML = "";
            actionMenuDiv.innerHTML = `<div style="font-size:0.8rem; text-align:center;">⌨️ use keypad • press ENTER when done</div>`;
            amountInputArea.style.display = "none";
        }
        else if (currentState === "menu") {
            pinDisplaySpan.style.display = "block";
            pinDisplaySpan.innerHTML = "✓✓✓✓";
            dynamicMessageDiv.innerHTML = "✅ Welcome to NEO ATM • Select transaction ✅";
            optionsMenuDiv.innerHTML = `
                <button class="menu-btn" id="checkBalanceBtn">💰 CHECK BALANCE</button>
                <button class="menu-btn" id="withdrawBtn">💸 WITHDRAW CASH</button>
                <button class="menu-btn" id="depositBtn">📥 DEPOSIT CASH</button>
                <button class="menu-btn exit-menu-btn" id="exitMenuBtn">🚪 EXIT / CARD EJECT</button>
            `;
            actionMenuDiv.innerHTML = `<div style="font-size:0.8rem;">⚡ Choose an option from menu ⚡</div>`;
            amountInputArea.style.display = "none";
            
            document.getElementById("checkBalanceBtn")?.addEventListener("click", handleCheckBalance);
            document.getElementById("withdrawBtn")?.addEventListener("click", showAmountInput);
            document.getElementById("depositBtn")?.addEventListener("click", showAmountInput);
            document.getElementById("exitMenuBtn")?.addEventListener("click", ejectCardAndExit);
        }
        else if (currentState === "amount_input") {
            pinDisplaySpan.style.display = "none";
            dynamicMessageDiv.innerHTML = `💰 Enter amount for ${pendingTransactionType === "withdraw" ? "WITHDRAWAL" : "DEPOSIT"} 💰`;
            optionsMenuDiv.innerHTML = "";
            amountInputArea.style.display = "block";
            amountInputArea.innerHTML = `
                <div class="amount-input-box">
                    <div style="font-size:1rem; margin-bottom:10px;">Enter Amount (₹)</div>
                    <div class="amount-display" id="amountDisplay">₹ 0</div>
                    <div class="amount-buttons">
                        <button class="quick-amount" data-quick="500">+₹500</button>
                        <button class="quick-amount" data-quick="1000">+₹1000</button>
                        <button class="quick-amount" data-quick="2000">+₹2000</button>
                        <button class="quick-amount" data-quick="5000">+₹5000</button>
                    </div>
                    <div class="amount-buttons" style="margin-top:10px;">
                        <button class="menu-btn" id="confirmAmountBtn" style="background:#2e7d32;">✓ CONFIRM</button>
                        <button class="menu-btn" id="cancelAmountBtn" style="background:#8b3c2c;">✗ CANCEL</button>
                    </div>
                </div>
            `;
            actionMenuDiv.innerHTML = `<div style="font-size:0.7rem;">⌨️ Type amount using keypad • or use quick buttons</div>`;
            
            document.getElementById("confirmAmountBtn")?.addEventListener("click", confirmAmount);
            document.getElementById("cancelAmountBtn")?.addEventListener("click", cancelAmount);
            document.querySelectorAll(".quick-amount").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    let addValue = parseInt(e.target.getAttribute("data-quick"));
                    let current = parseInt(amountInputValue) || 0;
                    let newAmount = current + addValue;
                    if (newAmount <= 50000) {
                        amountInputValue = newAmount.toString();
                        updateAmountDisplay();
                    } else {
                        setTemporaryMessage("Maximum amount ₹50,000", true);
                    }
                });
            });
            updateAmountDisplay();
        }
    }

    function updateAmountDisplay() {
        const display = document.getElementById("amountDisplay");
        if (display) {
            let val = amountInputValue === "" ? "0" : amountInputValue;
            display.innerHTML = `₹ ${parseInt(val).toLocaleString()}`;
        }
    }

    function setTemporaryMessage(msg, isError = false) {
        const originalHTML = dynamicMessageDiv.innerHTML;
        dynamicMessageDiv.innerHTML = isError ? `⚠️ ${msg} ⚠️` : `✨ ${msg} ✨`;
        setTimeout(() => {
            if (currentState === "menu") dynamicMessageDiv.innerHTML = "✅ Welcome to NEO ATM • Select transaction ✅";
            else if (currentState === "pin_entry") dynamicMessageDiv.innerHTML = "🔐 ENTER YOUR 4-DIGIT PIN on keypad 🔐";
            else if (currentState === "waiting_card") dynamicMessageDiv.innerHTML = "💳 Please insert your card using INSERT CARD button 💳";
            else if (currentState === "amount_input") dynamicMessageDiv.innerHTML = `💰 Enter amount for ${pendingTransactionType === "withdraw" ? "WITHDRAWAL" : "DEPOSIT"} 💰`;
        }, 2000);
    }

    function insertCard() {
        if (currentState === "waiting_card") {
            cardInserted = true;
            authenticated = false;
            enteredPin = "";
            currentState = "pin_entry";
            refreshUI();
            setTemporaryMessage("Card detected! Enter your PIN.", false);
        } else {
            setTemporaryMessage("Card already inserted. Use EJECT first.", true);
        }
    }

    function ejectCardAndExit() {
        cardInserted = false;
        authenticated = false;
        enteredPin = "";
        currentState = "waiting_card";
        pendingTransactionType = null;
        amountInputValue = "";
        refreshUI();
        setTemporaryMessage("💳 Card ejected. Thank you!", false);
    }

    function addPinDigit(digit) {
        if (currentState !== "pin_entry") return;
        if (enteredPin.length < 4) {
            enteredPin += digit;
            refreshUI();
        } else {
            setTemporaryMessage("Maximum 4 digits. Press ENTER or CLEAR.", true);
        }
    }

    function clearPin() {
        if (currentState === "pin_entry") {
            enteredPin = "";
            refreshUI();
            setTemporaryMessage("PIN cleared.", false);
        } else if (currentState === "amount_input") {
            amountInputValue = "";
            updateAmountDisplay();
            setTemporaryMessage("Amount cleared.", false);
        }
    }

    function submitPin() {
        if (currentState !== "pin_entry") return;
        if (enteredPin.length !== 4) {
            setTemporaryMessage("PIN must be 4 digits!", true);
            return;
        }
        if (enteredPin === CORRECT_PIN) {
            authenticated = true;
            currentState = "menu";
            refreshUI();
            setTemporaryMessage("PIN ACCEPTED. Access granted.", false);
        } else {
            setTemporaryMessage("INCORRECT PIN! Try again.", true);
            enteredPin = "";
            refreshUI();
        }
    }

    function handleCheckBalance() {
        if (currentState !== "menu" || !authenticated) return;
        setTemporaryMessage(`Your balance is ₹ ${currentBalance.toFixed(2)}`, false);
        dynamicMessageDiv.innerHTML = `💵 CURRENT BALANCE: ₹ ${currentBalance.toFixed(2)} 💵`;
        setTimeout(() => {
            if (currentState === "menu") dynamicMessageDiv.innerHTML = "✅ Welcome to NEO ATM • Select transaction ✅";
        }, 2500);
    }

    function showAmountInput() {
        if (currentState !== "menu" || !authenticated) return;
        let type = event.target.id === "withdrawBtn" ? "withdraw" : "deposit";
        pendingTransactionType = type;
        amountInputValue = "";
        currentState = "amount_input";
        refreshUI();
    }

    function confirmAmount() {
        if (currentState !== "amount_input") return;
        
        let amount = parseInt(amountInputValue);
        if (isNaN(amount) || amount <= 0) {
            showPopup('error', 0, currentBalance, 'Please enter a valid amount greater than ₹0');
            return;
        }
        
        if (amount > 50000) {
            showPopup('error', amount, currentBalance, 'Maximum transaction limit is ₹50,000 per transaction');
            return;
        }
        
        if (pendingTransactionType === "withdraw") {
            if (amount > currentBalance) {
                showPopup('error', amount, currentBalance, `Insufficient funds! Your balance is ₹${currentBalance.toLocaleString()}`);
                return;
            }
            if (amount % 100 !== 0 && amount % 50 !== 0) {
                showPopup('error', amount, currentBalance, 'ATM only dispenses ₹50 or ₹100 multiples.\nPlease enter amount like ₹500, ₹1000, ₹2000 etc.');
                return;
            }
            currentBalance -= amount;
            // SHOW WITHDRAWAL POPUP
            showPopup('withdraw', amount, currentBalance);
        } 
        else if (pendingTransactionType === "deposit") {
            currentBalance += amount;
            // SHOW DEPOSIT POPUP
            showPopup('deposit', amount, currentBalance);
        }
        
        pendingTransactionType = null;
        amountInputValue = "";
        currentState = "menu";
        refreshUI();
    }

    function cancelAmount() {
        pendingTransactionType = null;
        amountInputValue = "";
        currentState = "menu";
        refreshUI();
        setTemporaryMessage("Transaction cancelled.", false);
    }

    // Keypad handlers
    document.querySelectorAll(".key[data-num]").forEach(btn => {
        btn.addEventListener("click", () => {
            const digit = btn.getAttribute("data-num");
            if (currentState === "pin_entry") {
                addPinDigit(digit);
            } else if (currentState === "amount_input") {
                if (amountInputValue.length < 6) {
                    amountInputValue += digit;
                    updateAmountDisplay();
                } else {
                    setTemporaryMessage("Maximum 6 digits (₹99,999)", true);
                }
            }
        });
    });

    document.getElementById("clearPinBtn").addEventListener("click", clearPin);
    document.getElementById("enterPinBtn").addEventListener("click", () => {
        if (currentState === "pin_entry") submitPin();
        else if (currentState === "amount_input") confirmAmount();
    });
    document.getElementById("insertCardBtn").addEventListener("click", insertCard);
    document.getElementById("ejectCardBtn").addEventListener("click", ejectCardAndExit);

    refreshUI();
