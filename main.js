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
    
    var flags = {}; //Flags set by words. Permanent
    var text_flags = {}; // Flags set by text Temporary
    
    var permanent_styles_list = []; //Defines which styles for the body are permanent ones
    var temporary_styles_list = ["flash-dark"]; //Defines which styles for the body are temporary ones, such as dark flashes.
    
    var p_styles = []; // Permanent styles applied to the body
    var t_styles = []; // Temporary styles applied to the body
    
    //For debugging: 
    var html_story_yaml = document.getElementById("story_yaml");
    
    
    
    ///Helper functions for the story
    var get_substitute_text = function(story_dictionary, text_keyword){
        if (!story_dictionary[text_keyword]){
                console.log("UNDEFINED "+ text_keyword);
                return "--UNDEFINED--";
        }
        return story_dictionary[text_keyword].text;
    };
    
    
    var substitute_text = function (text_to_substitute, 
                                     substitute_dictionary, 
                                     story_dictionary, 
                                     previous_substituted_text, 
                                     new_substituted_text, 
                                     parent_dummy_span) {
        for (var key in substitute_dictionary){
            var text_keyword = substitute_dictionary[key]
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
                        new_text_html.className = 'substituting-text '
                    }
                    else{
                        new_text_html.className = 'new-text '
                    }
                }
                else{
                    new_text_html.className = 'old-text '
                }
                var substitute_text_with_html =  new_text_html.outerHTML;
                if (parent_dummy_span){
                    var span_tags = parent_dummy_span.split("$");
                    substitute_text_with_html = span_tags[1]+substitute_text_with_html+span_tags[0];
                }
                new_text_html.innerHTML="$";
                var new_dummy_span = new_text_html.outerHTML;
                substitute_text_with_html = substitute_text(substitute_text_with_html, substitute_dictionary, story_dictionary,  previous_substituted_text, new_substituted_text, new_dummy_span);
                text_to_substitute = text_to_substitute.replace(to_substitute, substitute_text_with_html);
            }
        }
        return text_to_substitute;
    };

    /// Helper functions for generating HTML
    

    var action_click_word = function(word_dict_object, text_dict, flags){
        var function_array = [];
        if (word_dict_object.click){
            var click_array = word_dict_object.click;
            for (var s in  click_array){
                var click_action = click_array[s];
                if (!click_action.condition || conditions_met(click_action.condition, flags)){
                    function_array.push(()=>add_to_substitute_dict(click_action.substitutions, text_dict));
                    if (click_action.flags){
                        function_array.push(()=>add_flags(click_action.flags, flags));
                    }
                    if (click_action.remove_flags){
                        function_array.push(()=>remove_flags(click_action.remove_flags, flags));
                    }
                    if (click_action.body_class){
                        function_array.push(()=>add_styles_to_body(click_action.body_class));
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

        add_interactivity_to_words(keys, dictionary, text_dict, flags);
    }
    
    var add_interactivity_to_words = function(word_keys, dictionary, text_dict, flags){
        for (var index in word_keys){
            //add on click events
            var key = word_keys[index];
            var word = document.getElementById(key)
            var word_click_function = action_click_word(dictionary[key], text_dict, flags);
            if (word_click_function){
                word.classList.add('clickable-word');
                word.addEventListener("click", word_click_function, false); 
            }
        }
    }

    var remove_markers = function(text){
        text = text.replace(/\$.*?\$/g, '');
        return text;
    }

    var proccess_words = function(html_story, text, story_dict, text_dict, flags){
        var text = remove_markers(text);
        html_story.innerHTML = text;
        substitute_words(html_story, story_dict, text_dict, flags);
    }
    
    var clear_class_body = function(){
        var body = document.getElementById("text-background");
        body.className = " ";
    }
            
    
    var copy_dict = function(dict_to_copy_from, dict_to_copy_to){    
        Object.keys(dict_to_copy_from).forEach(function(key) {
         dict_to_copy_to[ key ] = dict_to_copy_from[ key ];
        }); 
    }
    
    var apply_styles_to_el = function(temporary_styles_list, permanent_styles_list, el){
        var class_list = el.classList;
        var length_classes = class_list.length;
        for(var i =0; i<length_classes; i++){
            var elClass = class_list[i];
            if (!permanent_styles_list.includes(elClass)){
                el.classList.remove(elClass);
            }
        }
        add_classes_to_el(temporary_styles_list, el);
        add_classes_to_el(permanent_styles_list, el);
        temporary_styles_list.length=0;
    }
    
    var add_classes_to_el = function(classes_list, el){
        for (var s in classes_list){
            var style = classes_list[s]; 
            add_class(style, el);
        }

    }
    


    // Actions

    var add_to_substitute_dict =  function(substitute_dict_object, text_dict){
        for (var s in substitute_dict_object){
            text_dict[s] = substitute_dict_object[s];
        }
    }
    
    var add_flags =  function(flags_from_word, flags){
        for (var f in flags_from_word){
            var flag = flags_from_word[f];
            if (typeof flag == 'string'){
                flags[flag] = true;
            }
            else{
                for (var flag_name in flag){
                    if (flags[flag_name]){
                        flags[flag_name]+=flag[flag_name];
                    }     
                    else{
                        flags[flag_name] = flag[flag_name];
                    }
                }

            }
        }
    };
    
    var remove_flags =  function(flags_to_remove, flags){
        for (var f in flags_to_remove){
            delete flags[flags_to_remove[f]];
        }
    
    }
    
    var add_styles_to_body = function(styles){
        if (styles.constructor === Array){
            for (var s in styles){
                var style = styles[s];
                if (permanent_styles_list.includes(style)){
                    add_permanent_style_to_body(style);
                }
                if (temporary_styles_list.includes(style)){
                    add_temporary_style_to_body(style);
                }
            }
        }
        else{ //assume is string
            if (permanent_styles_list.includes(styles)){
                add_permanent_style_to_body(styles);
            }
            if (temporary_styles_list.includes(styles)){
                add_temporary_style_to_body(styles);
            }
            
        }
    }
    
    
    
    // Actions helper
    var add_permanent_style_to_body = function(style){
        p_styles.push(style);
    }
    
    var add_temporary_style_to_body = function(style){
        t_styles.push(style);
    }
        
    var add_class = function(class_name, el){
        setTimeout(()=>el.classList.add(class_name), 30 );
    }

    var conditions_met = function(condition, flags){
        var condition_flags = condition.flags;
        if (condition_flags){
            for (var f in condition_flags){
                if (!flags[condition_flags[f]]){
                    return false;
                }
            }
        }
        var condition_not_flags = condition.not_flags;
        if (condition_not_flags){
            for (var f in condition_not_flags){
                if (flags[condition_not_flags[f]]){
                    return false;
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
        html_story_yaml.value=story_yaml;
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
        add_ctrl_s();
    }
    
    var reload_yaml_from_html = function(){
        story = yaml.load(html_story_yaml.value);
        generate_story();
    }
    
    var add_functions_to_buttons = function(){
        var reload_button = document.getElementById("reload_yaml");
        reload_button.addEventListener("click", reload_yaml_from_html, false); 
    }
    
    var add_ctrl_s = function(){
        html_story_yaml.addEventListener("keydown", function(e) {
            if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
                downloadInnerHtml("story.yaml", html_story_yaml, "yaml");
                alert('captured');
            }
        }, false);
    }
    
    var downloadInnerHtml = function(filename, el, mimeType) {
        var elHtml = el.value;
        var link = document.createElement('a');
        mimeType = mimeType || 'text/plain';

        link.setAttribute('download', filename);
        link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(elHtml));
        link.click(); 
    }
    
    //Generate story
    
    var generate_story = function(){
        new_substituted_text={};
        var text = substitute_text(start_text, substitute_text_dictionary, story, previous_substituted_text, new_substituted_text);
        previous_substituted_text=new_substituted_text;
        copy_dict(new_substituted_text, previous_substituted_text);
        proccess_words(html_story, text, story, substitute_text_dictionary, flags);
        var body = document.getElementById("text-background");
        apply_styles_to_el(t_styles,p_styles,body);
        
    }   
    
    
    editing();
    
    
    generate_story();

});
