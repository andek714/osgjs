import Controller from 'osgGA/Controller';
import utils from 'osg/utils';
import InputGroups from 'osgViewer/input/InputConstants';

var FirstPersonManipulatorStandardMouseKeyboardController = function(manipulator) {
    Controller.call(this, manipulator);
    this.init();
};

utils.createPrototypeObject(
    FirstPersonManipulatorStandardMouseKeyboardController,
    utils.objectInherit(Controller.prototype, {
        init: function() {
            this._delay = 0.15;
            this._stepFactor = 1.0; // meaning radius*stepFactor to move
            this._looking = false;
            
            this._stepFactorInterval = [0.01, 4.0];
            this._stepDeltaFactor = 0.01;

            var manager = this._manipulator.getInputManager();
            manager.group(InputGroups.FPS_MANIPULATOR_MOUSEKEYBOARD).addMappings(
                {
                    startLookAt: 'mousedown',
                    lookAt: 'mousemove',
                    stopLookAt: ['mouseup', 'mouseout'],
                    goForward: ['keydown w', 'keydown z', 'keydown ArrowUp'],
                    goBackward: ['keydown s', 'keydown ArrowDown'],
                    goLeft: ['keydown a', 'keydown q', 'keydown ArrowLeft'],
                    goRight: ['keydown d', 'keydown ArrowRight'],
                    stopMoving: [
                        'keyup w',
                        'keyup z',
                        'keyup ArrowUp',
                        'keyup s',
                        'keyup ArrowDown'
                    ],
                    stopStrafing: [
                        'keyup a',
                        'keyup q',
                        'keyup ArrowLeft',
                        'keyup d',
                        'keyup ArrowRight'
                    ],
                    changeStepFactor: 'wheel'
                },
                this
            );

            manager.group(InputGroups.FPS_MANIPULATOR_RESETTOHOME).addMappings(
                {
                    reset: 'keydown space'
                },
                this
            );
        },
        // called to enable/disable controller
        setEnable: function(bool) {
            if (!bool) {
                // reset mode if we disable it
                this._buttonup = true;
            }
            Controller.prototype.setEnable.call(this, bool);
        },

        setManipulator: function(manipulator) {
            this._manipulator = manipulator;

            // we always want to sync speed of controller with manipulator
            this._manipulator.setStepFactor(this._stepFactor);
        },

        stopLookAt: function() {
            this._looking = false;
        },

        startLookAt: function(ev) {
            var manipulator = this._manipulator;
            manipulator.getLookPositionInterpolator().set(ev.canvasX, -ev.canvasY);
            this._looking = true;
        },

        lookAt: function(ev) {
            if (!this._looking) {
                return;
            }

            this._manipulator.getLookPositionInterpolator().setDelay(this._delay);
            this._manipulator.getLookPositionInterpolator().setTarget(ev.canvasX, -ev.canvasY);
        },

        setStepFactor: function(stepFactor) {
          this._stepFactor = stepFactor;
        },
  
        setStepFactorInterval: function(stepFactorInterval) {
          this._stepFactorInterval = stepFactorInterval;
        },

        setStepDeltaFactor: function(stepDeltaFactor) {
          this._stepDeltaFactor = stepDeltaFactor;
        },

        changeStepFactor: function(ev) {
            this._stepFactor = Math.min(Math.max(this._stepFactorInterval[0], this._stepFactor + ev.deltaY * this._stepDeltaFactor), this._stepFactorInterval[1]);
            this._manipulator.setStepFactor(this._stepFactor);
        },

        reset: function() {
            this._manipulator.computeHomePosition();
        },

        goForward: function() {
            this._manipulator.getForwardInterpolator().setDelay(this._delay);
            this._manipulator.getForwardInterpolator().setTarget(1);
        },

        goBackward: function() {
            this._manipulator.getForwardInterpolator().setDelay(this._delay);
            this._manipulator.getForwardInterpolator().setTarget(-1);
        },

        goLeft: function() {
            this._manipulator.getSideInterpolator().setDelay(this._delay);
            this._manipulator.getSideInterpolator().setTarget(-1);
        },

        goRight: function() {
            this._manipulator.getSideInterpolator().setDelay(this._delay);
            this._manipulator.getSideInterpolator().setTarget(1);
        },

        stopMoving: function() {
            this._manipulator.getForwardInterpolator().setDelay(this._delay);
            this._manipulator.getForwardInterpolator().setTarget(0);
        },

        stopStrafing: function() {
            this._manipulator.getSideInterpolator().setDelay(this._delay);
            this._manipulator.getSideInterpolator().setTarget(0);
        }
    })
);

export default FirstPersonManipulatorStandardMouseKeyboardController;
