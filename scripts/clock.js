// Import CSS variables
const root = document.documentElement;
const digit_font_size = Number(getComputedStyle(root).getPropertyValue('--digit-font-size').slice(0,-2));
const digit_gap_in_column = Number(getComputedStyle(root).getPropertyValue('--digit-gap-in-column').slice(0,-2));

// Creates and returns a column of digits 0-9
function makeDigitColumn(new_id) {
    let column = document.createElement("div");
    column.classList.add("digit_column");
    column.id = new_id;

    for (let i = 0; i < 10; i++) {
        let digit = document.createElement("h3");
        digit.classList.add("digit");
        digit.innerHTML = i;
        column.appendChild(digit);
    }

    return column;
}

// Given the column of digits to change and a new digit, will shift to the new digit
function changeDigit(column_id, new_digit) {
    let column = document.getElementById(column_id);
    const shift_value = -1*new_digit*(digit_font_size + digit_gap_in_column);
    column.style.transform = `translateY(${shift_value}px)`;
}

// Appends a zero to the front of single-digit numbers
function addZero(i) {
    if (i < 10) {i = "0" + i}
    return i;
}

// Given the new hour, minute, and second, will adjust the displayed time
export function adjustTime(hour, minute, second, millisecond) {
    hour = addZero(hour);
    minute = addZero(minute);
    second = addZero(second);
    millisecond = `${millisecond}`;

    hour = String(hour);
    minute = String(minute);
    second = String(second);

    changeDigit("hour_ten", hour[0]);
    changeDigit("hour_one", hour[1]);
    changeDigit("minute_ten", minute[0]);
    changeDigit("minute_one", minute[1]);
    changeDigit("second_ten", second[0]);
    changeDigit("second_one", second[1]);
    changeDigit("millisecond_hundred", millisecond[0]);
    changeDigit("millisecond_ten", millisecond[1]);
    // changeDigit("millisecond_one", millisecond[2]);
}

// Change CSS variables to reflect either "dark" or "light" mode
// function changePageTheme(new_theme) {
//     if (new_theme === "light") { // Apply light mode
//         root.style.setProperty("--accent-color", "black");
//         root.style.setProperty("--background-color", "white");
//         root.style.setProperty("--icon-filter", "none");
//         root.style.setProperty("--hover-color", "rgb(225,225,225)");
//         document.getElementById("mode_icon").src = "./assets/moon.svg";
//         current_mode = "light";
//     } 
//     else { // Apply dark mode
//         root.style.setProperty("--accent-color", "white");
//         root.style.setProperty("--background-color", "black");
//         root.style.setProperty("--icon-filter", "invert(100%) sepia(1%) saturate(4579%) hue-rotate(177deg) brightness(111%) contrast(101%)");
//         root.style.setProperty("--hover-color", "rgb(30,30,30)");
//         document.getElementById("mode_icon").src = "./assets/sun.svg";
//         current_mode = "dark";
//     }
// }

// Setup dark/light mode button
// let btn = document.getElementById("mode_btn");
// let current_mode = "light";
// changePageTheme(current_mode); // Set default theme
// btn.addEventListener("click", function() {
//     if (current_mode === "dark") {
//         changePageTheme("light");
//     }
//     else {
//         changePageTheme("dark");
//     }
// })

function createColonCharacter() {
    let colon_char = document.createElement("h3");
    colon_char.classList.add("digit");
    colon_char.innerHTML = ":";
    return colon_char;
}

function createDecimalCharacter() {
    let decimal_char = document.createElement("h3");
    decimal_char.classList.add("digit");
    decimal_char.innerHTML = ".";
    return decimal_char;
}

// Get the clock to populate with digits
let clock_box = document.getElementById("clock_box");

// Create the digit columns
clock_box.appendChild(makeDigitColumn("hour_ten"));
clock_box.appendChild(makeDigitColumn("hour_one"));
clock_box.appendChild(createColonCharacter());
clock_box.appendChild(makeDigitColumn("minute_ten"));
clock_box.appendChild(makeDigitColumn("minute_one"));
clock_box.appendChild(createColonCharacter());
clock_box.appendChild(makeDigitColumn("second_ten"));
clock_box.appendChild(makeDigitColumn("second_one"));
clock_box.appendChild(createColonCharacter());
clock_box.appendChild(makeDigitColumn("millisecond_hundred"));
clock_box.appendChild(makeDigitColumn("millisecond_ten"));
// clock_box.appendChild(makeDigitColumn("millisecond_one"));

// Update the displayed time every second
// setInterval(function() {
//     const d = new Date();
//     let h = d.getHours();
//     let m = d.getMinutes();
//     let s = d.getSeconds();
//     adjustTime(h, m, s);
// }, 1000);