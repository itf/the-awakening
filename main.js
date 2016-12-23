require.config({
    paths : {
        text: 'text'
    }
});


require(['text!./story.yaml', 'js-yaml'], function (story_yaml, yaml) {
    //Global variables
    'use strict';
    var story = yaml.load(story_yaml);
    var start_text = story.begin.text;
    var substitute_text_dictionary = {"start": "rooftop-start"};
    var previous_substituted_text = [];
    var new_substituted_text = [];
    var html_story = document.getElementById("story");
    var html_story_yaml = document.getElementById("story_yaml");
    var flags = {};
    
    
    
    ///Helper functions for the story
    var get_substitute_text = function(story_dictionary, text_keyword){
        return story_dictionary[text_keyword].text;
    };
    
    
    var substitute_text = function (text_to_substitute, substitute_dictionary, story_dictionary, previous_substituted_text, new_substituted_text) {
        for (var key in substitute_dictionary){
            var text_keyword = substitute_dictionary[key]
            if (!story_dictionary[text_keyword]){
                console.log("UNDEFINED");
                delete substitute_dictionary[key];
                return text_to_substitute;
            }
            var substitute_text_content = get_substitute_text(story_dictionary, text_keyword);
            var to_substitute = '$'+key+'$';
            var contains_string = text_to_substitute.includes(to_substitute);


            if (contains_string){    
                new_substituted_text[key] = substitute_text_content;
                var new_text_html = get_dummy_word();
                new_text_html.id = key;
                new_text_html.innerHTML = substitute_text_content;
                if(substitute_text_content != previous_substituted_text[key]){
                    if (previous_substituted_text[key]){
                        new_text_html.className = 'substituting-text'
                    }
                    else{
                        new_text_html.className = 'new-text'
                    }
                }
                else{
                    new_text_html.className = 'old-text'
                }
                var substitute_text_with_html =  new_text_html.outerHTML;
                substitute_text_with_html = substitute_text(substitute_text_with_html, substitute_dictionary, story_dictionary,  previous_substituted_text, new_substituted_text);
                text_to_substitute = text_to_substitute.replace(to_substitute, substitute_text_with_html);
            }
        }
        return text_to_substitute;
    };

    /// Helper functions for generating HTML

    var action_click_word = function(word_dict_object, text_dict, flags){
        var function_array = [];
        if (word_dict_object.click){
            var substitute_array = word_dict_object.click;
            for (var s in  substitute_array){
                var substitution = substitute_array[s];
                if (!substitution.condition || conditions_met(substitution.condition, flags)){
                    function_array.push(add_to_substitute_dict(substitution.substitutions, text_dict));
                    if (substitution.flag){
                        function_array.push(add_flag(substitution.flag, flags));
                    }
                    if (substitution.remove_flags){
                        function_array.push(remove_flags(substitution.remove_flags, flags));
                    }
                    break;
                }
            }
        }
        if (function_array.length == 0){
            return null;
        }
        else{
            function_array.push(generate_story);
            return function_array_to_function(function_array);
        }
    }

    var dummy_word = document.createElement('span'); //To not create multiple word elements
    var get_dummy_word = function(){
        while(dummy_word.attributes.length > 0)
            dummy_word.removeAttribute(dummy_word.attributes[0].name);
        return dummy_word;
    }

    var substitute_words = function (html_story, dictionary, text_dict, flags){
        var original_text = html_story.innerHTML;
        var text_to_substitute = html_story.innerHTML;
        var keys = [];
        for (var key in dictionary){
            var to_substitute = '['+key+']';
            var contains_string = text_to_substitute.includes(to_substitute);
            
            if (contains_string){
                keys.push(key);
                var word = get_dummy_word();
                word.id = key;
                word.innerHTML = dictionary[key]['word'];
                var substitute =  word.outerHTML;
                text_to_substitute = text_to_substitute.replace(to_substitute,substitute );
                html_story.innerHTML = text_to_substitute;
            }  
        }

        for (var index in keys){
            //add on click events
            var key = keys[index];
            word = document.getElementById(key)
            var word_click_function = action_click_word(dictionary[key], text_dict, flags);
            if (word_click_function){
                word.className = 'clickable-word'
                word.addEventListener("click", word_click_function, false); 
            }
        }
        return text_to_substitute;
    }

    var remove_markers = function(text){
        text = text.replace(/\$.*?\$/g, '');
        return text;
    }

    var to_html = function(html_story, text, story_dict, text_dict, flags){
        var text = remove_markers(text);
        html_story.innerHTML = text;
        substitute_words(html_story, story_dict, text_dict, flags);
    }
    
    var copy_dict = function(dict_to_copy_from, dict_to_copy_to){    
        Object.keys(dict_to_copy_from).forEach(function(key) {
         dict_to_copy_to[ key ] = dict_to_copy_from[ key ];
        }); 
    }

    // Actions

    var add_to_substitute_dict =  function(substitute_dict_object, text_dict){
        return  function() { 
            for (var s in substitute_dict_object){
                text_dict[s] = substitute_dict_object[s];
            }
        };
    }
    
    var add_flag =  function(flag, flags){
        return function(){
            flags[flag] = true;
        }
    }
    
    var remove_flags =  function(flags_to_remove, flags){
        return function(){
            for (var f in flags_to_remove){
                delete flags[flags_to_remove[f]];
            }
        }
    }
    
    // Actions helper

    var conditions_met = function(condition, flags){
        var condition_flags = condition.flags;
        if (condition_flags){
            for (var f in condition_flags){
                if (!flags[condition_flags[f]]){
                    return false
                }
            }
        }
        return true;
    }
    
    var function_array_to_function = function(function_array){
        return function(){
            for (var f in function_array){
                function_array[f]();
            }
        }
    }

    
    //Functions to help with editing
    
    var editing = function(){
        html_story_yaml.innerHTML=yaml.safeDump(story);
        add_functions_to_buttons();
        add_functions_to_content_editable();
    }
    
    var add_functions_to_content_editable = function(){
        html_story_yaml.onkeydown=function(e){
            if(e.keyCode==9){
                document.execCommand('insertHTML', false, '  ');
                e.preventDefault();
            }
        }
    }
    
    var reload_yaml_from_html = function(){
        story = yaml.load(html_story_yaml.innerHTML);
        generate_story();
    }
    
    var add_functions_to_buttons = function(){
        var reload_button = document.getElementById("reload_yaml");
        reload_button.addEventListener("click", reload_yaml_from_html, false); 
    }
    
    //Generate story
    
    var generate_story = function(){
        new_substituted_text={};
        var text = substitute_text(start_text, substitute_text_dictionary, story, previous_substituted_text, new_substituted_text);
        previous_substituted_text=new_substituted_text;
        copy_dict(new_substituted_text, previous_substituted_text);
        to_html(html_story, text, story, substitute_text_dictionary, flags);
    }   
    
    
    editing();
    
    
    generate_story();

});
