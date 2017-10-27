//匿名方法 (function() {...})();
(function() {
	/**
	 * Variables
	 */
	var user_id = '1111';
	var lng = -122.08;
	var lat = 37.38;

	function init() {
		// Register event listeners
		$('nearby-btn').addEventListener('click', loadNearbyItems);
		$('fav-btn').addEventListener('click', loadFavoriteItems);
		$('recommend-btn').addEventListener('click', loadRecommendedItems);

		initGeoLocation();
	}
	
	function $(tag, options) {
		if (!options) {
			return document.getElementById(tag);
		}

		var element = document.createElement(tag);

		for (var option in options) {
			if (options.hasOwnProperty(option)) {
				element[option] = options[option];
			}
		}

		return element;
	}

	function showLoadingMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i> '
				+ msg + '</p>';
	}

	function showWarningMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i> '
				+ msg + '</p>';
	}

	function showErrorMessage(msg) {
		var itemList = $('item-list');
		itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-circle"></i> '
				+ msg + '</p>';
	}

	function activeBtn(btnId) {
		var btns = document.getElementsByClassName('main-nav-btn');

		for (var i = 0; i < btns.length; i++) {
			btns[i].className = btns[i].className.replace(/\bactive\b/, '');
		}

		// active the one that has id = btnId
		var btn = $(btnId);
		btn.className += ' active';
	}

	//从这个方法先开始
	//点击按钮，然后就会送出一个request，然后从服务器回传一整个json格式的array，收到array以后，我们找到这个array list，把它本来的内容清空
	//然后把从服务读取来的这个array里的数据一条一条加到前端这边
	function listItems(items) {
		//<ul id="item-list">
		var itemList = $('item-list');
		// Clear the current results 把之前的预设值都清空
		itemList.innerHTML = '';

		for (var i = 0; i < items.length; i++) {
			addItem(itemList, items[i]);
		}
	}

	function addItem(itemList, item) {
		// "item_id":"G5vYZfEXfby0Z",这是我从json数据中粘贴出来的一段数据
		var item_id = item.item_id;

		// create the <li> tag and specify the id and class attributes
		// 对应<li class="item">这个 这个id有什么用?
		var li = $('li', {
			id : 'item-' + item_id,
			className : 'item'
		});

		// set the data attribute
		// 记录一些和这个tag相关的东西
		li.dataset.item_id = item_id;
		li.dataset.favorite = item.favorite;

		// item image
		if (item.image_url) {
			li.appendChild($('img', {
				src : item.image_url
			}));
		} else {
			li.appendChild($('img',{
				src : 'https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png'
			}))
		}
		
		// section
		var section = $('div', {});

		// title
		// 这里就是那个活动名字的链接然后到TicketMaster那里
		var title = $('a', {
			href : item.url,
			//注明以后这个链接点击过后会另外开一个网页显示链接里的内容
			target : '_blank',
			className : 'item-name'
		});
		title.innerHTML = item.name;
		section.appendChild(title);

		// category
		var category = $('p', {
			className : 'item-category'
		});
		//item.categories.join(', ') 因为category是一个array，我们希望把它做成一个以,_链接的string
		category.innerHTML = 'Category: ' + item.categories.join(', ');
		section.appendChild(category);

		var stars = $('div', {
			className : 'stars'
		});

		for (var i = 0; i < item.rating; i++) {
			var star = $('i', {
				className : 'fa fa-star'
			});
			stars.appendChild(star);
		}

		if (('' + item.rating).match(/\.5$/)) {
			stars.appendChild($('i', {
				className : 'fa fa-star-half-o'
			}));
		}

		section.appendChild(stars);

		li.appendChild(section);

		// address
		var address = $('p', {
			className : 'item-address'
		});

		var addressHTML =  item.address + "<br/>" + item.city;
		address.innerHTML = addressHTML;
		
		//address.innerHTML = item.address.replace(/,/g, '<br/>').replace(/\"/g, '');
		li.appendChild(address);

		// favorite link
		var favLink = $('div', {
			className : 'fav-link'
		});

		//点击之后爱心会发生变化
		favLink.onclick = function() {
			changeFavoriteItem(item_id);
		};

		favLink.appendChild($('i', {
			id : 'fav-icon-' + item_id,
			className : item.favorite ? 'fa fa-heart' : 'fa fa-heart-o'
		}));

		li.appendChild(favLink);

		itemList.appendChild(li);
	}
	
	function initGeoLocation() {
		//这个navigator是自带的? 浏览器给权限来查找经纬度
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(onPositionUpdated,
					onLoadPositionFailed, {
						maximumAge : 60000
					});
			showLoadingMessage('Retrieving your location...');
		} else {
			onLoadPositionFailed();
		}
	}
    
	//这个position哪儿来的
	function onPositionUpdated(position) {
		lat = position.coords.latitude;
		lng = position.coords.longitude;

		loadNearbyItems();
	}

	function onLoadPositionFailed() {
		console.warn('navigator.geolocation is not available');
		//从IP找location
		getLocationFromIP();
	}

	function getLocationFromIP() {
		// Get location from http://ipinfo.io/json
		var url = 'http://ipinfo.io/json'
		var req = null;
		ajax('GET', url, req, function(res) {
			var result = JSON.parse(res);
			if ('loc' in result) {
				var loc = result.loc.split(',');
				lat = loc[0];
				lng = loc[1];
			} else {
				console.warn('Getting location by IP failed.');
			}
			loadNearbyItems();
		});
	}
	
	/**
	 * API #1 Load the nearby items API end point: [GET]
	 * /Titan/search?user_id=1111&lat=37.38&lon=-122.08
	 */
	function loadNearbyItems() {
		//这个是干嘛的
		console.log('loadNearbyItems');
		activeBtn('nearby-btn');

		// The request parameters
		var url = './search';
		var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;
		var req = JSON.stringify({});

		// display loading message
		showLoadingMessage('Loading nearby items...');

		// make AJAX call
		ajax('GET', url + '?' + params, req,
		// successful callback
		function(res) {
			var items = JSON.parse(res);
			if (!items || items.length === 0) {
				showWarningMessage('No nearby item.');
			} else {
				listItems(items);
			}
		},
		// failed callback
		function() {
			showErrorMessage('Cannot load nearby items.');
		});
	}

	/**
	 * API #2 Load favorite (or visited) items API end point: [GET]
	 * /Titan/history?user_id=1111
	 */
	function loadFavoriteItems() {
		activeBtn('fav-btn');

		// The request parameters
		var url = './history';
		var params = 'user_id=' + user_id;
		var req = JSON.stringify({});

		// display loading message
		showLoadingMessage('Loading favorite items...');

		// make AJAX call
		ajax('GET', url + '?' + params, req, function(res) {
			var items = JSON.parse(res);
			if (!items || items.length === 0) {
				showWarningMessage('No favorite item.');
			} else {
				listItems(items);
			}
		}, function() {
			showErrorMessage('Cannot load favorite items.');
		});
	}
    
	/**
	 * API #3 Load recommended items API end point: [GET]
	 * /Titan/recommendation?user_id=1111
	 */
	function loadRecommendedItems() {
		activeBtn('recommend-btn');

		// The request parameters
		var url = './recommendation';
		var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;

		// JSON.parse() 把json string弄成json object. JSON.stringify() 把json object变成json string
		var req = JSON.stringify({});

		// display loading message
		showLoadingMessage('Loading recommended items...');

		// make AJAX call
		ajax(
				'GET', url + '?' + params, req,
				// successful callback
				function(res) {
					var items = JSON.parse(res);
					if (!items || items.length === 0) {
						showWarningMessage('No recommended item. Make sure you have favorites.');
					} else {
						listItems(items);
					}
				},
				// failed callback
				function() {
					showErrorMessage('Cannot load recommended items.');
				});
	}
    
	/**
	 * API #4 Toggle favorite (or visited) items
	 * 
	 * @param item_id -
	 *            The item business id
	 * 
	 */
	function changeFavoriteItem(item_id) {
		// Check whether this item has been visited or not
		var li = $('item-' + item_id);
		var favIcon = $('fav-icon-' + item_id);
		var favorite = li.dataset.favorite !== 'true';

		// The request parameters
		var url = './history';
		var req = JSON.stringify({
			user_id : user_id,
			favorite : [ item_id ]
		});
		var method = favorite ? 'POST' : 'DELETE';

		ajax(method, url, req,
		     // successful callback
		     function(res) {
			     var result = JSON.parse(res);
			     if (result.result === 'SUCCESS') {
				     li.dataset.favorite = favorite;
				     favIcon.className = favorite ? 'fa fa-heart' : 'fa fa-heart-o';
			     }
		     });
	}

	//callback是一个function 成功执行什么function 失败执行什么function
	function ajax(method, url, data, callback, errorHandler) {
		var xhr = new XMLHttpRequest();

		xhr.open(method, url, true);

		//这些是有回传的，也就是说从client端到server端这部分是成功的
		xhr.onload = function() {
			switch (xhr.status) {
			case 200:
				callback(xhr.responseText);
				break;
			//The server understood the request, but is refusing to fulfill it. Authorization will not help and the request SHOULD NOT be repeated. 
			//If the request method was not HEAD and the server wishes to make public why the request has not been fulfilled, it SHOULD describe 
			//the reason for the refusal in the entity. If the server does not wish to make this information available to the client, the status 
			//code 404 (Not Found) can be used instead.
			case 403:
				onSessionInvalid();
				break;
			case 401:
				errorHandler();
				break;
			}
		};
		
        /*
         * 通常在HTTP协议里，客户端向服务器取得某个网页的时候，必须发送一个HTTP协议的头文件，告诉服务器客户端要下载什么信息以及相关的参数。
         * 而xhr就是通过HTTP协议取得网站上的文件数据的，所以也要发送HTTP头给服务器。 但是xhr默认的情况下有些参数可能没有说明在HTTP头里，
         * 这是当我们需要修改或添加这些参数时就用到了setRequestHeader方法。
         */
		
		//这里是说从client端到server端这部分是失败的
		xhr.onerror = function() {
			console.error("The request couldn't be completed.");
			errorHandler();
		};

		//data === null 对应的例如get方法，意思就是不需要往服务器发送任何数据，只是请求
		if (data === null) {
			xhr.send();
		} else {
		//data !== null 对应例如post方法，有一些用户data被前端获取希望发送到服务器，注意这里是提醒后段传来的信息是json格式
			xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
			xhr.send(data);
		}
	}
	
	init();
	
})();