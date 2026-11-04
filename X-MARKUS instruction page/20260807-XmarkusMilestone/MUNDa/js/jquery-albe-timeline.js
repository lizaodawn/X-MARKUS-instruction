/*!
 * Albe-Timeline v4.0.2, https://github.com/Albejr/jquery-albe-timeline
 * ======================================================================
 * Plugin para renderização de 'linha do tempo' a partir de listas de dados em JSON
 *
 * 2017, Albertino Júnior, http://albertino.eti.br
 * MODIFIED BY GEMINI: Added 'hideDate' and 'hideJanuaryFirst' options.
 * MODIFIED: Added handling for year 9999 to display as "No date"
 */
(function ($) {
	$.fn.albeTimeline = function (json, options) {

		var _this = this;
		_this.html('');

		// 將使用者選項與預設值合併
		var settings = $.extend({}, $.fn.albeTimeline.defaults, options);

		// 根據設定載入語言，若無則使用預設值 (pt-BR)
		var idioma = ($.fn.albeTimeline.languages.hasOwnProperty(settings.language)) ?
			$.fn.albeTimeline.languages[settings.language] : { // 預設語言 pt-BR
				days: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
				months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
				shortMonths: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
				separator: 'de',
				msgEmptyContent: 'Sem informações a serem exibidas.',
			};

		// 若傳入的是 JSON 字串，則轉換為物件
		if (typeof (json) == 'string') {
			json = $.parseJSON(json);
		}

		// 若 JSON 為空，顯示預設訊息
		if ($.isEmptyObject(json)) {
			console.warn(idioma.msgEmptyContent);
			return;
		}

		// 根據日期排序
		json = json.sort(function (a, b) {
			return (settings.sortDesc) ? (Date.parse(b['time']) - Date.parse(a['time'])) : (Date.parse(a['time']) - Date.parse(b['time']));
		});

		var eMenu = $('<ul>').attr('id', 'timeline-menu');
		var eTimeline = $('<section>').attr('id', 'timeline');

		$.each(json, function (index, element) {

			var ano = new Date(element.time).getUTCFullYear();
			var agrupador = $(eTimeline).find('div.group' + ano);

			// 如果該年份的群組不存在，則建立一個
			if (agrupador.length === 0) {
				// === 修改：處理 9999 年份 ===
				var displayYear = (ano === 9999) ? 'No date' : ano;
				agrupador = $('<div>').attr('id', ('y' + ano)).addClass('group' + ano).text(displayYear);

				$(eTimeline).append(agrupador);

				var anchor = $('<a>').attr('href', ('#y' + ano)).text(displayYear);
				eMenu.append($('<li>').append(anchor));
			}

			/**************************************** SLOT <article> ****************************************/
			// === 修改開始 ===
			// 檢查是否為1月1日
			var currentDate = new Date(element.time);
			var isJanuaryFirst = settings.hideJanuaryFirst && currentDate.getMonth() === 0 && currentDate.getDate() === 1;
			
			var badge = $('<div>').addClass('badge');
			
			// 檢查 hideDate 或 isJanuaryFirst 設定，以決定是否顯示日期和月份
			if (!settings.hideDate && !isJanuaryFirst) {
				badge.html(fnDateFormat(element.time, settings.formatDate, idioma));
			}
			// === 修改結束 ===

			var ePanel = $('<div>').addClass('panel').append(badge);

			if (element.header) {
				var ePanelHead = $('<div>').addClass('panel-heading');
				var ePaneltitle = $('<h4>').addClass('panel-title').text(element.header);

				ePanelHead.append(ePaneltitle);
				ePanel.append(ePanelHead);
			}

			var ePanelBody = $('<div>').addClass('panel-body');
			$.each(element.body, function (index2, value2) {

				// HTML 元素
				var e = $('<' + value2.tag + '>');

				// 元素的屬性
				$(value2.attr).each(function () {
					$.each(this, function (index3, value3) {
						// 特殊屬性，因為 'class' 是 javascript 的保留字
						(index3.toLowerCase() === 'cssclass') ? e.addClass(value3): e.attr(index3, value3);
					});
				});

				// 元素的內容
				if (value2.content)
					e.html(value2.content);

				ePanelBody.append(e);
			});

			ePanel.append(ePanelBody);

			if (element.footer) {
				var ePanelFooter = $('<div>').addClass('panel-footer').html(element.footer);
				ePanel.append(ePanelFooter);
			}

			// 將項目加到對應的群組中
			var irmaos = agrupador.siblings('article[id^="a' + ano + '"]');
			var slot = $('<article id="a' + ano + '-' + (irmaos.length + 1) + '">').append(ePanel);

			if (irmaos.length > 0)
				slot.insertAfter(irmaos.last());
			else
				slot.insertAfter(agrupador);
			/**************************************** FIM - SLOT <article> ****************************************/
		});

		// Timeline 的初始標記
		var badge = $('<div>').addClass('badge').html('&nbsp;');
		var ePanel = $('<div>').addClass('panel').append(badge);
		eTimeline.append($('<article>').append(ePanel));
		eTimeline.append($('<div>').addClass('clearfix').css({
			'float': 'none'
		}));

		$.each(eTimeline.find('article'), function (index, value) {
			// 添加 CSS class 來反轉項目的位置
			$(this).addClass((index % 2 == 0) ? '' : 'inverted');
			// 添加動畫 class
			if (settings.effect && settings.effect != 'none')
				$(this).addClass('animated ' + settings.effect);
		});

		// 選單的顯示取決於群組的可見性設定
		if (settings.showGroup) {
			if (settings.showMenu) {
				eMenu.appendTo(_this);
			}
		} else {
			$.each(eTimeline.find('div[class*="group"]'), function (index, value) {
				$(this).css('display', 'none');
			});
		}

		eTimeline.appendTo(_this);
	};

	// 多國語言支援
	$.fn.albeTimeline.languages = {
		'zh-TW': {
			days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
			months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
			shortMonths: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
			separator: ' ',
			msgEmptyContent: '沒有可顯示的資訊。',
		}
	};

	// 預設選項
	$.fn.albeTimeline.defaults = {
		effect: 'fadeInUp',      // 動畫效果
		formatDate: 'MMMM d日',    // 日期格式
		language: 'pt-BR',       // 預設語言
		showGroup: true,         // 顯示年份群組
		showMenu: true,          // 顯示年份選單
		sortDesc: true,          // 日期遞減排序
		hideDate: false,         // 設定為 true 來隱藏所有日期與月份
		hideJanuaryFirst: false  // === 新增選項 ===: 設定為 true 來隱藏1月1日的日期與月份
	};

	// 日期格式化函式
	var fnDateFormat = function (value, format, language) {

		var parts = value.split(/[ :\-\/]/g);
		var newDate = new Date(parts[0], (parts[1] - 1), parts[2], (parts[3] || 0), (parts[4] || 0), (parts[5] || 0));

		if (language.separator) {
			format = format.replace(new RegExp(language.separator, 'g'), '___');
		}

		format = format.replace('ss', padLeft(newDate.getSeconds(), 2));
		format = format.replace('s', newDate.getSeconds());
		format = format.replace('dd', padLeft(newDate.getDate(), 2));
		format = format.replace('d', newDate.getDate());
		format = format.replace('mm', padLeft(newDate.getMinutes(), 2));
		format = format.replace('m', newDate.getMinutes());
		format = format.replace('MMMM', language.months[newDate.getMonth()]);
		format = format.replace('MMM', language.shortMonths[newDate.getMonth()]);
		format = format.replace('MM', padLeft((newDate.getMonth() + 1), 2));
		format = format.replace('DD', language.days[newDate.getDay()]);
		format = format.replace('yyyy', newDate.getUTCFullYear());
		format = format.replace('YYYY', newDate.getUTCFullYear());
		format = format.replace('yy', (newDate.getUTCFullYear() + '').substring(2));
		format = format.replace('YY', (newDate.getUTCFullYear() + '').substring(2));
		format = format.replace('HH', padLeft(newDate.getHours(), 2));
		format = format.replace('H', newDate.getHours());

		if (language.separator) {
			format = format.replace(new RegExp('___', 'g'), language.separator);
		}

		return format;
	};

	// 補零函式
	var padLeft = function (n, width, z) {
		z = z || '0';
		n = n + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	};

})(jQuery);