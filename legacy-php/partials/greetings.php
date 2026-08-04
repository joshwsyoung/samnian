<?php
function getGreeting()
{
    date_default_timezone_set('Europe/London');
    $hour = date("G");

    $morning = [
        "Good morning, ",
        "Wakey wakey, ",
        "Rise and shine, ",
        "Hope you slept well, ",
        "Top of the morning, ",
        "What a lovely morning, ",
        "It’s a brand new day, ",
        "The sun’s up, ",
        "Early bird vibes, ",
        "Starting the day fresh, ",
    ];

    $afternoon = [
        "Good afternoon, ",
        "Hey there, ",
        "How’s your day going, ",
        "Nice to see you this afternoon, ",
        "Hope you're having a chill day, ",
        "Sun’s still up, ",
        "Taking a little break, ",
        "What’s happening, ",
        "Hope the vibe is good, ",
    ];

    $evening = [
        "Good evening, ",
        "Hope you had a great day, ",
        "Kicking back yet, ",
        "Unwinding time, ",
        "What’s the plan tonight, ",
        "Evening’s looking good, ",
        "Settle in and relax, ",
        "How’s the night shaping up, ",
    ];

    $night = [
        "Still up, ",
        "Late night check-in, ",
        "Burning the midnight oil, ",
        "Can’t sleep, ",
        "Quiet night, isn’t it, ",
        "The stars are out, ",
        "Night owl mode, ",
        "The night’s still young, ",
        "Rest can wait, ",
        "Chilling in the dark, ",
    ];

    if ($hour >= 5 && $hour < 12) {
        return $morning[array_rand($morning)];
    } elseif ($hour >= 12 && $hour < 17) {
        return $afternoon[array_rand($afternoon)];
    } elseif ($hour >= 17 && $hour < 21) {
        return $evening[array_rand($evening)];
    } else {
        return $night[array_rand($night)];
    }
}