﻿define([
    'foreground/view/genericForegroundView',
    'text!template/videoSearchResult.html',
    'foreground/collection/contextMenuGroups',
    'foreground/collection/videoSearchResults',
    'foreground/collection/streamItems',
    'foreground/collection/folders',
    'foreground/view/genericPromptView',
    'foreground/view/saveVideosView',
    'enum/listItemType'
], function (GenericForegroundView, VideoSearchResultTemplate, ContextMenuGroups, VideoSearchResults, StreamItems, Folders, GenericPromptView, SaveVideosView, ListItemType) {
    'use strict';

    var VideoSearchResultView = GenericForegroundView.extend({
        
        className: 'listItem videoSearchResult multiSelectItem',

        template: _.template(VideoSearchResultTemplate),
        
        attributes: function () {
            return {
                'data-id': this.model.get('id'),
                'data-type': ListItemType.VideoSearchResult
            };
        },
        
        instant: false,
        
        events: {
            'click i.playInStream': 'playInStream',
            'click i.addToStream': 'addToStream',
            'click i.save': 'saveToPlaylist',
            'dblclick': 'playInStream',
            'contextmenu': 'showContextMenu'
        },

        render: function () {

            this.$el.html(this.template(
                _.extend(this.model.toJSON(), {
                    //  Mix in chrome to reference internationalize.
                    'chrome.i18n': chrome.i18n,
                    'instant': this.instant
                })
            ));

            this.setHighlight();

            return this;
        },
        
        initialize: function (options) {
            this.instant = options && options.instant || false;

            this.listenTo(this.model, 'change:selected', this.setHighlight);
            this.listenTo(this.model, 'destroy', this.remove);
        },
        
        setHighlight: function () {
            this.$el.toggleClass('selected', this.model.get('selected'));
        },
        
        playInStream: function () {
            var video = this.model.get('video');
            StreamItems.addByVideo(video, true);
        },
        
        addToStream: function() {
            var video = this.model.get('video');
            StreamItems.addByVideo(video, false);
        },
        
        saveToPlaylist: function () {
           
            var video = this.model.get('video');

            var saveVideosPromptView = new GenericPromptView({
                title: chrome.i18n.getMessage('saveVideo'),
                okButtonText: chrome.i18n.getMessage('save'),
                model: new SaveVideosView({
                    //  SaveVideosView expects an array of video.
                    model: [video]
                })
            });

            saveVideosPromptView.listenTo(saveVideosPromptView.model, 'change:creating', function (creating) {

                if (creating) {
                    this.okButton.text(chrome.i18n.getMessage('createPlaylist'));
                } else {
                    this.okButton.text(chrome.i18n.getMessage('save'));
                }

            });

            saveVideosPromptView.fadeInAndShow();
        },
        
        showContextMenu: function (event) {

            var video = this.model.get('video');
            
            event.preventDefault();

            ContextMenuGroups.reset();
            
            ContextMenuGroups.add({
                items: [{
                    text: chrome.i18n.getMessage('play'),
                    onClick: function () {
                        StreamItems.addByVideo(video, true);
                    }
                }, {
                    text: chrome.i18n.getMessage('enqueue'),
                    onClick: function () {
                        StreamItems.addByVideo(video, false);
                    }
                }, {
                    text: chrome.i18n.getMessage('copyUrl'),
                    onClick: function () {
                        chrome.extension.sendMessage({
                            method: 'copy',
                            text: video.get('url')
                        });
                    }
                }, {
                    text: chrome.i18n.getMessage('copyTitleAndUrl'),
                    onClick: function () {

                        chrome.extension.sendMessage({
                            method: 'copy',
                            text: '"' + video.get('title') + '" - ' + video.get('url')
                        });
                    }
                }, {
                    text: chrome.i18n.getMessage('watchOnYouTube'),
                    onClick: function () {

                        chrome.tabs.create({
                            url: video.get('url')
                        });

                    }
                }]
            });

        }
    });

    return VideoSearchResultView;
});