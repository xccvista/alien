/*!
 * 对话框
 * @author ydr.me
 * @create 2015-01-11 16:53
 */


define(function (require, exports, module) {
    /**
     * @module ui/Dialog/
     * @requires ui/Mask/
     * @requires ui/Window/
     * @requires ui/Scrollbar/
     * @requires util/dato
     * @requires util/typeis
     * @requires core/dom/selector
     * @requires core/dom/attribute
     * @requires core/dom/modification
     * @requires core/dom/animation
     * @requires core/event/drag
     * @requires libs/Template
     * @requires ui/base
     */
    'use strict';

    var Mask = require('../Mask/');
    var Window = require('../Window/');
    var Scrollbar = require('../Scrollbar/');
    var dato = require('../../util/dato.js');
    var typeis = require('../../util/typeis.js');
    var selector = require('../../core/dom/selector.js');
    var attribute = require('../../core/dom/attribute.js');
    var modification = require('../../core/dom/modification.js');
    var animation = require('../../core/dom/animation.js');
    var event = require('../../core/event/drag.js');
    var Template = require('../../libs/Template.js');
    var template = require('html!./template.html');
    var style = require('css!./style.css');
    var tpl = new Template(template);
    var ui = require('../base.js');
    var $body = document.body;
    var defaults = {
        width: 500,
        height: 'auto',
        left: 'center',
        top: 'center',
        title: '无标题对话框',
        canDrag: true,
        hideClose: false,
        duration: 456,
        easing: 'ease-in-out-back',
        addClass: '',
        remote: null,
        isModal: true,
        zIndex: null
    };
    var alienIndex = 0;
    var alienClass = 'alien-ui-dialog';
    var Dialog = ui.create({
        constructor: function ($content, options) {
            var the = this;

            the._$content = selector.query($content)[0];
            the._options = dato.extend(true, {}, defaults, options);
            the._init();
        },


        _init: function () {
            var the = this;
            var options = the._options;

            if (options.isModal) {
                the._mask = new Mask(window, {
                    addClass: alienClass + '-bg',
                    zIndex: options.zIndex
                });
                the._$mask = the._mask.getNode();
                the._mask.__diloag = the;
            }

            the._window = new Window(null, {
                parentNode: options.isModal ? the._$mask : $body,
                width: options.width,
                height: options.height,
                left: options.left,
                top: options.top,
                duration: options.duration,
                easing: options.easing,
                zIndex: options.zIndex
            });
            the._$window = the._window.getNode();
            the._initNode();

            if (options.isModal) {
                the._scrollbar = new Scrollbar(the._$window);
            }

            the._initEvent();

            if (options.remote) {
                the.setRemote(options.remote);
            }

            return the;
        },


        _initNode: function () {
            var the = this;
            var options = the._options;
            var html = tpl.render({
                id: alienIndex++,
                windowId: the._$window.id,
                title: options.title,
                canDrag: options.canDrag,
                hideClose: options.hideClose
            });
            var node = modification.parse(html)[0];
            var nodes = selector.query('.j-flag', node);
            var $pos = modification.create('div');

            the._$dialog = node;
            the._$header = nodes[0];
            the._$title = nodes[1];
            the._$close = nodes[2];
            the._$body = nodes[3];

            modification.insert(the._$dialog, the._$window);
            modification.insert($pos, the._$content, 'afterend');
            the._$pos = $pos;
            modification.insert(the._$content, the._$body);
        },


        _initEvent: function () {
            var the = this;

            // 对话框打开
            the._window.on('open', function () {
                if (the._scrollbar) {
                    the._scrollbar.resize();
                }
            });

            // 点击关闭
            event.on(the._$close, 'click', function () {
                the.close();
            });

            // 单击背景
            event.on(the._$mask, 'click', function (eve) {
                var $window = selector.closest(eve.target, '#' + the._$window.id)[0];

                if (!$window && the.emit('hitbg') !== false) {
                    the.shake();
                }

                return false;
            });
        },


        /**
         * 设置对话框标题
         * @param title {String} 对话框标题
         */
        setTitle: function (title) {
            var the = this;

            the._$title.innerHTML = title;

            return the;
        },


        /**
         * 设置对话框内容
         * @param html {String} 对话框内容
         */
        setContent: function (html) {
            var the = this;

            the._$body.innerHTML = html;
            the.resize();

            return the;
        },


        /**
         * 对话框添加远程地址，并重新定位
         * @param url {String} 远程地址
         * @returns {Dialog}
         */
        setRemote: function (url) {
            var the = this;
            var options = the._options;
            var $iframe = modification.create('iframe', {
                src: url,
                class: alienClass + '-iframe',
                style: {
                    height: options.remoteHeight
                }
            });

            the._$body.innerHTML = '';
            $iframe.onload = function () {
                options.remote = null;
                the.resize();
            };
            $iframe.onerror = function () {
                the.resize();
            };
            modification.insert($iframe, the._$body, 'beforeend');

            return the;
        },


        /**
         * 晃动对话框以示提醒
         */
        shake: function () {
            var the = this;

            the._window.shake();

            return the;
        },


        /**
         * 打开 dialog
         * @param [callback] {Function} 回调
         */
        open: function (callback) {
            var the = this;

            if (the._mask) {
                the._mask.open();
            }

            the._window.open(callback);

            return the;
        },


        /**
         * 改变 dialog 尺寸
         * @param [size] {Object} 尺寸
         * @param [callback] {Function} 回调
         */
        resize: function (size, callback) {
            this._window.resize(size, callback);
        },


        /**
         * 关闭 dialog
         * @param [callback] {Function} 回调
         */
        close: function (callback) {
            var the = this;


            the._window.close(function () {
                if (the._mask) {
                    the._mask.close();
                }

                if (typeis.function(callback)) {
                    callback();
                }
            });

            return the;
        },


        /**
         * 销毁实例
         */
        destroy: function () {
            var the = this;

            the._window.destroy(function () {
                modification.insert(the._$content, the._$pos, 'afterend');
                modification.remove(the._$pos);
                event.un(the._$close, 'click');
                event.un(the._$mask, 'click');
                modification.remove(the._$dialog);
                the._mask.destroy();
            });
        }
    });


    event.on(document, 'keyup', function (eve) {
        var mask;
        var dialog;

        if (eve.which === 27 && Mask.maskWindowList.length) {
            mask = Mask.getTopMask();
            dialog = mask.__diloag;

            if (dialog.emit('esc') !== false) {
                dialog.shake();
            }
        }
    });


    /**
     * 实例化一个对话框
     * @param [options] {Object} 配置
     * @param [options.width=300] {Number} 宽度
     * @param [options.height="auto"] {Number|String} 高度
     * @param [options.left="center"] {Number|String} 左位移
     * @param [options.top="center"] {Number|String} 上位移
     * @param [options.title="提示"] {null|String} 标题，为 null 时不显示标题
     * @param [options.content="提示"] {String} 内容
     * @param [options.addClass=""] {String} 添加的类
     * @param [options.buttons=null] {null|Array} 按钮数组，如["确定"]
     * @param [options.canDrag=true] {Boolean} 是否可以被拖拽
     * @param [options.isModal=true] {Boolean} 是否为模态
     * @param [options.duration=345] {Number} 动画时间
     * @param [options.easing="ease-in-out-back"] {String} 动画缓冲
     * @param [options.zIndex=null] {null|Number} 消息框层级，为 null 时自动分配
     */
    module.exports = Dialog;
    modification.importStyle(style);
});