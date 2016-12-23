require.config({
    paths : {
        text: 'text',
        json: 'json',
    }
});


require(['text!./story.yaml', 'js-yaml'], function(story_yaml, yaml){
    var story = yaml.load( story_yaml );
    var text = story['start'].text;
    var user_text = text;
    var substitutes = {}

    //To test, pretend you clicked on the rooftop
    console.log(story.rooftop1.substitute)
    for (s in story.rooftop1.substitute){
        console.log(s)
        substitutes[s] = story.rooftop1.substitute[s]
    }

    //substitute the substitute marks
    for (key in substitutes){
        substitute = key
        console.log(key)
        user_text = user_text.replace(key, substitutes[key])
    }
    
    
    //Cleans up the text before showing it to the user
    for (key in story){
        substitute = '['+key+']'
        text = text.replace('['+key+']', story[key]['word'])
    }
    
    
    //Removes {something} markers
    user_text = user_text.replace(/\{.*?\}/g, '');
    console.log(user_text);
});
