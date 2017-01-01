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
    var temporary_styles_list = ["flash-dark", "flash-red"]; //Defines which styles for the body are temporary ones, such as dark flashes.
    
    var p_styles = []; // Permanent styles applied to the body
    var t_styles = []; // Temporary styles applied to the body
    
    var previous_states=[]; // For undo.
    
    //For debugging: 
    var html_story_yaml = document.getElementById("story_yaml");
    
    
    
    ///Helper functions for the story
    var get_substitute_text = function(story_dictionary, text_keyword, flags, text_flags){
        var text = story_dictionary[text_keyword];
        if (!text){
                console.log("UNDEFINED "+ text_keyword);
                return "--UNDEFINED--";
        }
        if (text.text){
            return text.text;
        }
        else{ //Assume array of texts
            var array_text = text;
            for (var t in array_text){
                text = array_text[t];
                if (!text.cond || conditions_met(text.cond, flags, text_flags)){
                    return text.text;
                }

            }
        }
        return "--UNDEFINED--";
    };
    
    
    var substitute_text = function (text_to_substitute, 
                                     substitute_dictionary, 
                                     story_dictionary, 
                                     previous_substituted_text, 
                                     new_substituted_text, 
                                     parent_dummy_span,
                                     flags,
                                     text_flags,
                                     present_text_keys) {
        for (var key in substitute_dictionary){
            var text_keyword = substitute_dictionary[key]
            var substitute_text_content = get_substitute_text(story_dictionary, text_keyword, flags, text_flags);
            var to_substitute = '$'+key+'$';
            var contains_string = text_to_substitute.includes(to_substitute);

            if (contains_string){
                add_flags(text_keyword,text_flags);
                present_text_keys.push(text_keyword);
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
                substitute_text_with_html = substitute_text(substitute_text_with_html, 
                                                            substitute_dictionary, 
                                                            story_dictionary,  
                                                            previous_substituted_text, 
                                                            new_substituted_text, 
                                                            new_dummy_span,
                                                            flags,
                                                            text_flags,
                                                            present_text_keys);
                text_to_substitute = text_to_substitute.replace(to_substitute, substitute_text_with_html);
            }
        }
        return text_to_substitute;
    };

    /// Helper functions for generating HTML
    

    var action_click_word = function(word_dict_object, text_dict, flags, text_flags){
        var function_array = [];
        if (word_dict_object.click){
            var click_array = word_dict_object.click;
            if (click_array.constructor !== Array){
                click_array = [click_array];
            }
            for (var s in  click_array){
                var click_action = click_array[s];
                if (!click_action.cond || conditions_met(click_action.cond, flags, text_flags)){
                    
                    if (!is_useful_word(click_action, text_dict, flags, text_flags)){
                        return null;
                    }
                    
                    function_array.push(()=>add_to_substitute_dict(click_action.subs, text_dict));
                    if (click_action.flags){
                        function_array.push(()=>add_flags(click_action.flags, flags));
                    }
                    if (click_action.rm_flags){
                        function_array.push(()=>remove_flags(click_action.rm_flags, flags));
                    }
                    if (click_action.body_class){
                        function_array.push(()=>add_styles_to_body(click_action.body_class));
                    }
                    
                    if (click_action.undo){
                        function_array.push(()=>undo_story( ));
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

    var substitute_words = function (html_story, dictionary, text_dict, flags, text_flags){
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

        add_interactivity_to_words(keys, dictionary, text_dict, flags, text_flags);
    }
    
    var add_interactivity_to_words = function(word_keys, dictionary, text_dict, flags, text_flags){
        for (var index in word_keys){
            //add on click events
            var key = word_keys[index];
            var word = document.getElementById(key)
            var word_click_function = action_click_word(dictionary[key], text_dict, flags, text_flags);
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

    var proccess_words = function(html_story, text, story_dict, text_dict, flags, text_flags){
        var text = remove_markers(text);
        html_story.innerHTML = text;
        substitute_words(html_story, story_dict, text_dict, flags, text_flags);
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
    
    var undo_story = function(){
        if (previous_states.length>1){
            var old_state = previous_states.shift();
            old_state = previous_states.shift();
            text_flags = old_state[0];
            flags = old_state[1];
            substitute_text_dictionary = old_state[2];
            previous_substituted_text = old_state[3];
            new_substituted_text = old_state[4];
            p_styles = old_state[5];
            t_styles = old_state[6];
        }
    }

    var add_to_substitute_dict =  function(substitute_dict_object, text_dict){
        for (var s in substitute_dict_object){
            text_dict[s] = substitute_dict_object[s];
        }
    }
    
    var add_flags =  function(flags_from_word, flags){
        if (flags_from_word.constructor !== Array){
            flags_from_word = [flags_from_word];
        }
        for (var f in flags_from_word){
            var flag = flags_from_word[f];
            var value = 0;
            var flag_name;
            if (typeof flag == 'string'){
                flag_name = flag;
                value = 1;
            }
            else{
                for (flag_name in flag){
                    value = flag[flag_name]
                }
            }
            if (flags[flag_name]){
                flags[flag_name] += value;
            }     
            else{
                flags[flag_name] = value;
            }   
        }
    };
    
    var remove_flags =  function(flags_to_remove, flags){
        for (var f in flags_to_remove){
            delete flags[flags_to_remove[f]];
        }
    
    }
    
    var add_styles_to_body = function(styles){
        if (styles.constructor !== Array){
            styles = [styles];
        }
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
    
    
    
    // Actions helper
    var add_permanent_style_to_body = function(style){
        p_styles.push(style);
    }
    
    var add_temporary_style_to_body = function(style){
        t_styles.push(style);
    }
        
    var add_class = function(class_name, el){
        setTimeout(()=>el.classList.add(class_name), 10 );
    }

    var add_flags =  function(flags_from_word, flags){
        if (flags_from_word.constructor !== Array){
            flags_from_word = [flags_from_word];
        }
        for (var f in flags_from_word){
            var flag = flags_from_word[f];
            var value = 0;
            var flag_name;
            if (typeof flag == 'string'){
                flag_name = flag;
                value = 1;
            }
            else{
                for (flag_name in flag){
                    value = flag[flag_name]
                }
            }
            if (flags[flag_name]){
                flags[flag_name] += value;
            }     
            else{
                flags[flag_name] = value;
            }   
        }
    };
    
    var is_useful_word = function(click_action, substitute_text_dictionary, flags, text_flags){
        if (text_flags["END"] && !click_action.end){
            return false;
        }
        if (click_action.m){
            return true;
        }
        var subs = click_action.subs;
        if (subs){
            for (var s in subs){
                if (substitute_text_dictionary[s] != subs[s]){
                    return true;
                }
            }
        }
        
        var flags_from_word = click_action.flags;
        var not_flags_from_word = click_action.not_flags;
        
        if(flags_from_word){
            if (flags_from_word.constructor !== Array){
                flags_from_word = [flags_from_word];
            }
            for (var f in flags_from_word){
                var flag = flags_from_word[f];
                if (typeof flag == 'string'){
                    var flag_name = flag;
                    if (!flags[flag_name]){
                        return true;
                    }
                }
                else{
                    return true;
                }
            }
        }
        
        if(not_flags_from_word){
            if (not_flags_from_word.constructor !== Array){
                not_flags_from_word = [not_flags_from_word];
            }
            for (var f in not_flags_from_word){
                var flag = not_flags_from_word[f];
                if (typeof flag == 'string'){
                    var flag_name = flag;
                    if (flags[flag_name]){
                        return true;
                    }
                }
                else{
                    return true;
                }
            }
        }
    return false;
    }
    
    var conditions_met = function(condition, flags, text_flags){
        var condition_flags = condition.flags;
        if (condition_flags){
            if (condition_flags.constructor !== Array){
            condition_flags = [condition_flags];
            }
            for (var f in condition_flags){
                var flag = condition_flags[f];
                var value = 0;
                var flag_name;
                if (typeof flag == 'string'){
                    flag_name = flag;
                    value = 1;
                }
                else{
                    for (flag_name in flag){
                        value = flag[flag_name]
                    }
                }
                if ((!flags[flag_name] || flags[flag_name]<value) && (!text_flags[flag_name] || text_flags[flag_name]<value)){
                    return false;
                }
            }
        }
        var condition_not_flags = condition.not_flags;
        if (condition_not_flags){
            if (condition_not_flags.constructor !== Array){
                condition_not_flags = [condition_not_flags];
            }
            for (var f in condition_not_flags){
                var flag = condition_not_flags[f];
                var value = 0;
                var flag_name;
                if (typeof flag == 'string'){
                    flag_name = flag;
                    value = 1;
                }
                else{
                    for (flag_name in flag){
                        value = flag[flag_name]
                    }
                }
                if ((flags[flag_name] && flags[flag_name]>=value) || (text_flags[flag_name] && text_flags[flag_name]>=value)){
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
    
    var delete_unused_text_flags = function(text_flags, new_substituted_text){
        for (var flag in text_flags){
            if (! new_substituted_text.includes(flag)){
                delete text_flags[flag];
            }
        }
    }

    var push_story_state = function(previous_states, text_flags,flags,substitute_text_dictionary,previous_substituted_text,new_substituted_text, p_styles, t_styles){
        previous_states.unshift([clone_object(text_flags),clone_object(flags),clone_object(substitute_text_dictionary),clone_object(previous_substituted_text),clone_object(new_substituted_text), clone_object(p_styles), clone_object(t_styles)]);
        if (previous_states.length>10){
            previous_states.length=10;
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
    
    var restart_story = function(){
        substitute_text_dictionary = {"start": "rooftop-start"};
        previous_substituted_text = [];
        new_substituted_text = [];
        flags = {}; //Flags set by words. Permanent
        text_flags = {}; // Flags set by text Temporary
        p_styles = []; // Permanent styles applied to the body
        t_styles = []; // Temporary styles applied to the body
        previous_states=[]; // For undo.
        generate_story();   
    }
    
    var toggle_editing = function(){
        var editing = document.getElementById("editing")
        editing.classList.toggle('hidden');
    }
    
        
    var add_functions_to_buttons = function(){
        var reload_button = document.getElementById("reload_yaml");
        reload_button.addEventListener("click", reload_yaml_from_html, false); 
        var restart_button = document.getElementById("restart");
        restart_button.addEventListener("click", restart_story, false); 
        var toggle_button = document.getElementById("toggle_editing");
        toggle_button.addEventListener("click", toggle_editing, false); 
    }
    
    var add_ctrl_s = function(){
        html_story_yaml.addEventListener("keydown", function(e) {
            if (e.keyCode == 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
                e.preventDefault();
                downloadInnerHtml("story.yaml", html_story_yaml, "yaml");
            }
        }, false);
    }
    
    var editing_text_helper = function(present_text_keys){
        var subs = document.getElementById("subs");
        var subs2 = document.getElementById("subs2");

        subs.innerHTML = "";
        subs2.innerHTML = "";

        for ( var p in substitute_text_dictionary){
            if (present_text_keys.includes(substitute_text_dictionary[p])){
                subs.innerHTML += "[" + p + " "+ substitute_text_dictionary[p] + "] ";
                subs2.innerHTML += " "+new_substituted_text[p];

            }
        }
    }
    
    var downloadInnerHtml = function(filename, el, mimeType) {
        var elHtml = el.value;
        var link = document.createElement('a');
        mimeType = mimeType || 'text/plain';

        link.setAttribute('download', filename);
        link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(elHtml));
        link.click(); 
    }
    
    //Extra helpers
    
    function clone_object(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        var temp = obj.constructor(); // give temp the original obj's constructor
        for (var key in obj) {
            temp[key] = clone_object(obj[key]);
        }

        return temp;
    }
    
    //Generate story
    
    var generate_story = function(){
        push_story_state(previous_states, text_flags,flags,substitute_text_dictionary,previous_substituted_text,new_substituted_text, p_styles, t_styles);
        new_substituted_text={};
        var present_text_keys = [];
        var text = substitute_text(start_text, substitute_text_dictionary, story, previous_substituted_text, new_substituted_text, undefined, flags, text_flags, present_text_keys);
        previous_substituted_text=new_substituted_text;
        delete_unused_text_flags(text_flags, present_text_keys);
        proccess_words(html_story, text, story, substitute_text_dictionary, flags, text_flags);
        var body = document.getElementById("text-background");
        apply_styles_to_el(t_styles,p_styles,body);
        
        editing_text_helper(present_text_keys);
        
    }   
    
    
    editing();
    
    
    generate_story();

});
