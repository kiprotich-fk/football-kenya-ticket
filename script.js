const API_BASE = ""; // Same domain as your backend
const DEMO_MODE = false;

// Sample development data only.
// Replace with match data returned by your backend.
const matches = {
  "match-001": {
    name: "Gor Mahia vs AFC Leopards",
    date: "Set the confirmed match date",
    venue: "Set the confirmed stadium",
    prices: { regular: 500, vip: 1500, vvip: 3000 }
  },
  "match-002": {
    name: "Kenya vs Uganda",
    date: "Set the confirmed match date",
    venue: "Set the confirmed stadium",
    prices: { regular: 500, vip: 1500, vvip: 3000 }
  },
  "match-003": {
    name: "Tusker FC vs KCB FC",
    date: "Set the confirmed match date",
    venue: "Set the confirmed stadium",
    prices: { regular: 500, vip: 1500, vvip: 3000 }
  }
};

const form = document.getElementById("bookingForm");
const matchInput = document.getElementById("match");
const typeInput = document.getElementById("ticketType");
const quantityInput = document.getElementById("quantity");
const totalOutput = document.getElementById("totalAmount");
const detailsOutput = document.getElementById("matchDetails");
const messageOutput = document.getElementById("bookingMessage");
const bookButton = document.getElementById("bookButton");

function money(amount) {
  return "KSh " + amount.toLocaleString("en-KE");
}

function selectedMatch() {
  return matches[matchInput.value];
}

function updateBookingSummary() {
  const match = selectedMatch();

  if (!match) {
    detailsOutput.textContent = "Select a match to see its details.";
    totalOutput.textContent = money(0);
    return;
  }

  detailsOutput.textContent =
    match.name + " | " + match.date + " | " + match.venue;

  const quantity = Number(quantityInput.value);
  const price = match.prices[typeInput.value];

  totalOutput.textContent =
    Number.isInteger(quantity) && quantity >= 1 && quantity <= 10
      ? money(price * quantity)
      : "Check quantity";
}

matchInput.addEventListener("change", updateBookingSummary);
typeInput.addEventListener("change", updateBookingSummary);
quantityInput.addEventListener("input", updateBookingSummary);

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  messageOutput.textContent = "";

  const match = selectedMatch();
  const quantity = Number(quantityInput.value);
  const ticketType = typeInput.value;
  const name = document.getElementById("buyerName").value.trim();
  const phone = document.getElementById("buyerPhone").value.trim();
  const email = document.getElementById("buyerEmail").value.trim();

  if (!match) {
    messageOutput.textContent = "Please select a match.";
    return;
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    messageOutput.textContent = "Choose between 1 and 10 tickets.";
    return;
  }

  if (!Object.hasOwn(match.prices, ticketType)) {
    messageOutput.textContent = "Please select a valid ticket category.";
    return;
  }

  if (name.length < 2 || name.length > 100) {
    messageOutput.textContent = "Enter a valid full name.";
    return;
  }

  if (!/^(?:\+254|254|0)7[0-9]{8}$/.test(phone)) {
    messageOutput.textContent =
      "Enter a valid Kenyan mobile number.";
    return;
  }

  bookButton.disabled = true;
  bookButton.textContent = "Submitting booking...";

  try {
    const payload = {
      matchId: matchInput.value,
      ticketType,
      quantity,
      buyerName: name,
      buyerPhone: phone,
      buyerEmail: email || null
    };

    let result;

    if (DEMO_MODE) {
      // Browser-only test. This does NOT save a booking
      // or confirm payment.
      result = {
        bookingReference: "TEST-" + Date.now(),
        status: "PENDING_PAYMENT",
        totalAmount: match.prices[ticketType] * quantity
      };
    } else {
      const response = await fetch(
        `${API_BASE}/api/bookings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload)
        }
      );

      result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Booking failed. Please try again."
        );
      }
    }

    if (
      !result.bookingReference ||
      result.status !== "PENDING_PAYMENT"
    ) {
      throw new Error(
        "Unexpected server response. Please check your booking status."
      );
    }

    const amount = Number(result.totalAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error("Invalid booking total returned by the server.");
    }

    messageOutput.textContent =
      `Booking reference: ${result.bookingReference}. ` +
      `Total: ${money(amount)}. ` +
      "Status: PENDING PAYMENT. No confirmed ticket has been issued.";

    if (DEMO_MODE) {
      messageOutput.textContent +=
        " Browser-only test: no booking was saved.";
    } else {
      form.reset();
      updateBookingSummary();
    }
  } catch (error) {
    messageOutput.textContent =
      error.message || "Unable to submit booking.";
  } finally {
    bookButton.disabled = false;
    bookButton.textContent = "Reserve Tickets";
  }
});

updateBookingSummary();