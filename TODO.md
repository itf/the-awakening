TODO
---------

[] Define EXACTLY what kind of substitution can happen when the user clicks a word, and make it clear how new content can be added. 
    Clicking on words means that we are focusing on the concept of that word
    And we are on a dream word, so focusing on the concept can affect the world in different ways
    
    [] What happens when clicking nouns?
    
       Possibility 1: Add new content. Specially relevant for places
       Mainly: clicking on a noun means that we are focusing on the object of the noun. We are exploring it, making it grow in importance on the description
       Examples:
           Clicking on rooftop means that we are going to explore the rooftop. It can add content, such as adjectives related to the rooftop or rooftop environment
           (for example, it's dark. It is cold. There are vents, there is a door, etc. It's nice being under the sky, etc.). The added content should NOT be a surprise. If it is a surprise, add an 
           intermediate step. (for example: rooftop -> rooftop like any other-> you don't care about it).
       
       Possibility 2: Modify old content.
       Sometimes certain nouns have some implicit concept with them. For example, the night sky is usually beautiful and starry, so clicking on sky can add those adjectives or modify dark ones.
       Similarly, clicking on light/ flashlight can make things get lighter, rather than exploring the flashlight itself
       
       Possibility 3: Changing locations.
       Focusing on a place multiple times should allow you to be transported to that place. An example of this concept is:
       You see the light reflecting on the trees. (trees) -> The forest shines under the moon (forest) -> You can almost smell the trees (forest) -> 
       You are in the forest, you see the moonlight coming through the trees.
       
       The mechanic of being transported to a different place by clicking on the word is unexpected. Therefore, if the place is far away you should have to click the word
       at least twice as in the case of the example above.
       
       If the place is near, it can simply be a case of adding new content, such as : you see the vents (vents) -> You walk to the vents an look inside (inside). Inside the vent you smell
       asbestos, which makes you want to leave (leave) -> you are on a rooftop.
           

    [] What happens when clicking adjectives?
    Adjectives are generally not used to add new content, but rather to modify the way that the old content is perceived.
    Oc course this can cause new nouns or new things to show up (for example, clicking in dark can cause shadows to show up). 
    
    There are exceptions to this rule of thumb. For example, clicking in a "feeling adjective" for example, can cause you to remember things or add a sentence that is related to it
    Example. You feel happy (happy) -> The shadows move away (happy) -> you remember good things.
    
    [] What happens when you click in verbs?
    Generally, it should not be possible to click on verbs, unless strictly necessary, for example "You decide to fight [fight]". In this case it can do something completely different
    or just behave as an important and strong substantive in its behaviour.
    
    [] How to use probability (when implemented) ?
       Probability should never be used for content that is necessary for the story; unless it is in situations like: you are exploring the forest (10% chance of finding monster, etc).
        

[x] Make sure "old text" is not inside "new text". possible implementation, create element with the correct class and content = $. Split based on $, and then reverse the order of the elements.

[x] Make it so that every present text sets a flag whose value increase by one for every turn the text has been present and then returns to 0 as soon as it dissapears

[x] Make everything in the yaml be allowed to be either an array or a single value.

[x] Make so that text can depends on flags

[x] make it so that flags can check for values (for example, darkness > 5)

[Updated] Fix typewriter effect to work with multiple lines. Sadly, this involves using jquery.
    [x] Solved without jquery by using clip-path. Breaks compatibility with basically everything. 

[x] typewriter kinda effect using clip path

[x] Make sure all text continues in line if needed (css fix inline-block)

[x] Display the substitution words under the text

[x] Make sure useless buttons are not clickable anymore

[x] Implement Undo and undo word 

[] Create at least 2 min of gameplay.

[] Button to add word

[] Timed events

[] Split substitute_text into multiple functions

[x] Write undefined on the text if a substitution text is not defined yet, besides logging the substitution.

[x] Allow effects! Add style to the body of the program. Create 2 arrays, 1 for temporary and the other for permanent effects on the text.

[x] Create some "dark" effect: flashes the screen dark


[partial x] Specify naming convention for text and words. One idea is that all words are  word-(abbreviation of the place that the word is used), while the text is either "word that the text substitutes- place-what about the place" or "place - info bout the place"

[] Make it so that clicking words sets a flag as a syntatic sugar for allowing things to be clicked only once for example, or be clicked every few seconds or so

[] Create a way of replaying the words clicked

[] Create a way of saving the game

[] Add probability to what the text shows or what the word does

[] Deploy to android using https://crosswalk-project.org/ 

https://tympanus.net/codrops/2012/04/17/rotating-words-with-css-animations/