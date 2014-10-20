﻿//  This view is intended to house all of the player controls (play, pause, etc) as well as the StreamView
define([
    'common/enum/playerState',
    'foreground/model/timeArea',
    'foreground/view/rightPane/adminMenuAreaView',
    'foreground/view/rightPane/streamView',
    'foreground/view/rightPane/timeAreaView',
    'foreground/view/rightPane/volumeAreaView',
    'text!template/rightPane/rightPane.html'
], function (PlayerState, TimeArea, AdminMenuAreaView, StreamView, TimeAreaView, VolumeAreaView, RightPaneTemplate) {
    'use strict';

    var RightPaneView = Backbone.Marionette.LayoutView.extend({
        id: 'rightPane',
        className: 'rightPane column u-flex--column',
        template: _.template(RightPaneTemplate),
        
        ui: {
            nextButton: '#rightPane-nextButton',
            previousButton: '#rightPane-previousButton',
            playPauseButton: '#rightPane-playPauseButton',
            playIcon: '#rightPane-playIcon',
            pauseIcon: '#rightPane-pauseIcon',
            contentRegion: '#rightPane-contentRegion',
            timeAreaRegion: '#rightPane-timeAreaRegion',
            volumeAreaRegion: '#rightPane-volumeAreaRegion',
            adminMenuAreaRegion: '#rightPane-adminMenuAreaRegion'
        },
        
        regions: {
            contentRegion: '@ui.contentRegion',
            timeAreaRegion: '@ui.timeAreaRegion',
            volumeAreaRegion: '@ui.volumeAreaRegion',
            adminMenuAreaRegion: '@ui.adminMenuAreaRegion'
        },
        
        events: {
            'click @ui.nextButton': '_tryActivateNextStreamItem',
            'click @ui.previousButton': '_tryDoTimeBasedPrevious',
            'click @ui.playPauseButton': '_tryTogglePlayerState'
        },
        
        modelEvents: {
            'change:state': '_setPlayPauseButtonState'
        },
        
        nextButton: null,
        playPauseButton: null,
        previousButton: null,

        initialize: function () {
            this.nextButton = Streamus.backgroundPage.NextButton;
            this.playPauseButton = Streamus.backgroundPage.PlayPauseButton;
            this.previousButton = Streamus.backgroundPage.PreviousButton;

            this.listenTo(this.nextButton, 'change:enabled', this._setNextButtonDisabled);
            this.listenTo(this.previousButton, 'change:enabled', this._setPreviousButtonDisabled);
            this.listenTo(this.playPauseButton, 'change:enabled', this._setPlayPauseButtonState);
        },
        
        onRender: function () {
            this._setPlayPauseButtonState();
            this._setNextButtonDisabled();
            this._setPreviousButtonDisabled();
        },
        
        onShow: function () {
            this.timeAreaRegion.show(new TimeAreaView({
                model: new TimeArea()
            }));

            this.volumeAreaRegion.show(new VolumeAreaView({
                //  TODO: Feels bad to trickle a model down like this.
                model: this.model
            }));

            this.adminMenuAreaRegion.show(new AdminMenuAreaView());

            //  IMPORTANT: This needs to be appended LAST because top content is flexible which will affect this element's height.
            this.contentRegion.show(new StreamView({
                collection: Streamus.backgroundPage.StreamItems
            }));
        },
        
        _tryActivateNextStreamItem: function () {
            //  Model is persistent to allow for easy rule validation when using keyboard shortcuts to control.
            this.nextButton.tryActivateNextStreamItem();
        },
        
        _tryDoTimeBasedPrevious: function() {
            this.previousButton.tryDoTimeBasedPrevious();
        },
        
        _tryTogglePlayerState: function () {
            this.playPauseButton.tryTogglePlayerState();
        },
        
        _setNextButtonDisabled: function () {
            this.ui.nextButton.toggleClass('disabled', !this.nextButton.get('enabled'));
        },
        
        _setPreviousButtonDisabled: function() {
            this.ui.previousButton.toggleClass('disabled', !this.previousButton.get('enabled'));
        },

        _setPlayPauseButtonState: function() {
            var playerState = this.model.get('state');

            this.ui.playPauseButton
                .toggleClass('disabled', !this.playPauseButton.get('enabled'))
                .toggleClass('is-showingSpinner', playerState === PlayerState.Buffering);
            
            this.ui.pauseIcon.toggleClass('hidden', playerState !== PlayerState.Playing);
            this.ui.playIcon.toggleClass('hidden', playerState === PlayerState.Buffering || playerState === PlayerState.Playing);
        }
    });

    return RightPaneView;
});