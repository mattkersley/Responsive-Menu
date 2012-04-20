(function($){
	
	//plugin's default options
	var settings = {
		combine: true,					//combine multiple menus into a single select
		groupPageText: 'Main',			//optgroup's aren't selectable, make an option for it
		nested: true,					//create optgroups by default
		prependTo: 'body',				//insert at top of page by default
		switchWidth: 480,				//width at which to switch to select, and back again
		topOptionText: 'Select a page'	//default "unselected" state
	},
	
	//used to store original matched menus
	$menus,
	
	//used as a unique index for each menu if no ID exists
	menuCount = 0,
	
	//used to store unique list items for combining lists
	uniqueLinks = [];


	//go to page
	function goTo(url){
		document.location.href = url;
	}
	
	//does menu exist?
	function menuExists(){
		return ($('.mnav').length) ? true : false;
	}

	//validate selector's matched list(s)
	function isList($this){
		var pass = true;
		$this.each(function(){
			if(!$(this).is('ul') && !$(this).is('ol')){
				pass=false;
			}
		});
		return pass;
	}//isList()


	//function to decide if mobile or not
	function isMobile(){
		return ($(window).width() < settings.switchWidth);
	}
	
	
	//function to get text value of element, but not it's children
	function getText($item){
		return $.trim($item.clone().children('ul, ol').remove().end().text());
	}
	
	//function to check if URL is unique
	function isUrlUnique(url){
		return ($.inArray(url, uniqueLinks) === -1) ? true : false;
	}
	
	
	//function to do duplicate checking for combined list
	function checkForDuplicates($menu){
		
		$menu.find(' > li').each(function(){
		
			var $li = $(this),
				link = $li.find('a').attr('href'),
				parentLink = function(){
					if($li.parent().parent().is('li')){
						return $li.parent().parent().find('a').attr('href');
					} else {
						return null;
					}
				};
						
			//check nested <li>s before checking current one
			if($li.find(' ul, ol').length){
				checkForDuplicates($li.find('> ul, > ol'));
			}
		
			//remove empty UL's if any are left by LI removals
			if(!$li.find(' > ul li, > ol li').length){
				$li.find('ul, ol').remove();
			}
		
			//if parent <li> has a link, and it's not unique, append current <li> to the "unique parent" detected earlier
			if(!isUrlUnique(parentLink(), uniqueLinks) && isUrlUnique(link, uniqueLinks)){
				$li.appendTo(
					$menu.closest('ul#mmnav').find('li:has(a[href='+parentLink()+']):first ul')
				);
			}
			
			//otherwise, check if the current <li> is unique, if it is, add it to the unique list
			else if(isUrlUnique(link)){
				uniqueLinks.push(link);
			}
			
			//if it isn't, remove it. Simples.
			else{
				$li.remove();
			}
		
		});
	}
	
	
	//function to combine lists into one
	function combineLists(){
		
		//create a new list
		var $menu = $('<ul id="mmnav" />');
		
		//loop through each menu and extract the list's child items
		//then append them to the new list
		$menus.each(function(){
			$(this).children().clone().appendTo($menu);
		});
		
		//de-duplicate any repeated items
		checkForDuplicates($menu);
				
		//return new combined list
		return $menu;
		
	}//combineLists()
	
	
	
	//function to create options in the select menu
	function createOption($item, $container, text){
		
		//if no text param is passed, use list item's text, otherwise use settings.groupPageText
		if(!text){
			$('<option value="'+$item.find('a:first').attr('href')+'">'+$.trim(getText($item))+'</option>').appendTo($container);
		} else {
			$('<option value="'+$item.find('a:first').attr('href')+'">'+text+'</option>').appendTo($container);
		}
	
	}//createOption()
	
	
	
	//function to create option groups
	function createOptionGroup($group, $container){
		
		//create <optgroup> for sub-nav items
		var $optgroup = $('<optgroup label="'+$.trim(getText($group))+'" />');
		
		//append top option to it (current list item's text)
		createOption($group,$optgroup, settings.groupPageText);
	
		//loop through each sub-nav list
		$group.children('ul, ol').each(function(){
		
			//loop through each list item and create an <option> for it
			$(this).children('li').each(function(){
				createOption($(this), $optgroup);
			});
		});
		
		//append to select element
		$optgroup.appendTo($container);
		
	}//createOptionGroup()

	
	
	//function to create <select> menu
	function createSelect($menu){
	
		//create <select> to insert into the page
		var $select = $('<select id="mm'+menuCount+'" class="mnav" />');
		menuCount++;
		
		//create default option if the text is set (set to null for no option)
		if(settings.topOptionText){
			createOption($('<li>'+settings.topOptionText+'</li>'), $select);
		}
		
		//loop through first list items
		$menu.children('li').each(function(){
		
			var $li = $(this);

			//if nested select is wanted, and has sub-nav, add optgroup element with child options
			if($li.children('ul, ol').length && settings.nested){
				createOptionGroup($li, $select);
			}
			
			//otherwise it's a single level select menu, so build option
			else {
				createOption($li, $select);			
			}
						
		});
		
		//add change event and prepend menu to set element
		$select
			.change(function(){goTo($(this).val());})
			.prependTo(settings.prependTo);
	
	}//createSelect()

	
	//function to run plugin functionality
	function runPlugin(){
	
		//menu doesn't exist
		if(isMobile() && !menuExists()){
			
			//if user wants to combine menus, create a single <select>
			if(settings.combine){
				var $menu = combineLists();
				createSelect($menu);
			}
			
			//otherwise, create a select for each matched list
			else{
				$menus.each(function(){
					createSelect($(this));
				});
			}
		}
		
		//menu exists, and browser is mobile width
		if(isMobile() && menuExists()){
			$('.mnav').show();
			$menus.hide();
		}
			
		//otherwise, hide the mobile menu
		if(!isMobile() && menuExists()){
			$('.mnav').hide();
			$menus.show();
		}
		
	}//runPlugin()

	
	
	//plugin definition
	$.fn.mobileMenu = function(options){

		//override the default settings if user provides some
		if(options){$.extend(settings, options);}
		
		//check if user has run the plugin against list element(s)
		if(isList($(this))){
			$menus = $(this);
			runPlugin();
			$(window).resize(function(){runPlugin();});
		} else {
			alert('mobileMenu only works with <ul>/<ol>');
		}
				
	};//mobileMenu()
	
})(jQuery);
