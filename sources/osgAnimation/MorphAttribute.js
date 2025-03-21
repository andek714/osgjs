import utils from 'osg/utils';
import StateAttribute from 'osg/StateAttribute';
import Uniform from 'osg/Uniform';

/**
 * MorphAttribute encapsulate Animation State
 * @class MorphAttribute
 * @inherits StateAttribute
 */
var MorphAttribute = function(nbTarget, disable) {
    StateAttribute.call(this);
    this._nbTarget = nbTarget;
    this._enable = !disable;

    this._targetNames = {};
    this._hashNames = ''; // compute only once target hash names

    this._hash = ''; // cache of hash
    this._dirtyHash = true;
};

MorphAttribute.uniforms = {};

utils.createPrototypeStateAttribute(
    MorphAttribute,
    utils.objectInherit(StateAttribute.prototype, {
        attributeType: 'Morph',

        cloneType: function() {
            return new MorphAttribute(undefined, true);
        },

        hasTarget: function(name) {
            return !!this._targetNames[name];
        },

        copyTargetNames: function(names) {
            var tNames = this._targetNames;
            var hash = '';
            var nbNames = (tNames.length = names.length);

            for (var i = 0; i < nbNames; ++i) {
                var att = names[i];
                tNames[att] = true;
                hash += att;
            }

            this._hashNames = hash;
            this._dirtyHash = true;
        },

        getOrCreateUniforms: function() {
            var obj = MorphAttribute;
            var unifHash = this.getNumTargets();

            if (obj.uniforms[unifHash]) return obj.uniforms[unifHash];

            obj.uniforms[unifHash] = {
                uTargetWeights: Uniform.createFloat4('uTargetWeights')
            };

            return obj.uniforms[unifHash];
        },

        setNumTargets: function(nb) {
            this._nbTarget = nb;
            this._dirtyHash = true;
        },

        getNumTargets: function() {
            return this._nbTarget;
        },

        setTargetWeights: function(targetWeight) {
            this._targetWeights = targetWeight;
        },

        getTargetWeights: function() {
            return this._targetWeights;
        },

        isEnabled: function() {
            return this._enable;
        },

        getHash: function() {
            if (!this._dirtyHash) return this._hash;

            this._hash = this._computeInternalHash();
            this._dirtyHash = false;
            return this._hash;
        },

        _computeInternalHash: function() {
            return this.getTypeMember() + this._hashNames + this.getNumTargets() + this.isEnabled();
        },

        apply: function() {
            if (!this._enable) return;

            var uniformMap = this.getOrCreateUniforms();
            uniformMap.uTargetWeights.setFloat4(this._targetWeights);
        },
        
        compare: function(attr) {
            var compareTypes = StateAttribute.prototype.compare.call(this, attr);
            if (compareTypes !== 0) {
                return compareTypes;
            }
            if (this._nbTarget < attr._nbTarget) {
                return -1;
            }
            if (this._nbTarget > attr._nbTarget) {
                return 1;
            }
            if (this._enable < attr._enable) {
                return -1;
            }
            if (this._enable > attr._enable) {
                return 1;
            }

            var thisTargetNames = window.Object.keys(this._targetNames);
            var otherTargetNames = window.Object.keys(attr._targetNames);
            var thisNumTargetNames = thisTargetNames.length;
            var otherNumTargetNames = otherTargetNames.length;
            if (thisNumTargetNames < otherNumTargetNames) {
                return -1;
            }
            if (thisNumTargetNames > otherNumTargetNames) {
                return 1;
            }

            for (var i = 0; i < thisNumTargetNames; ++i) {
                if (thisTargetNames[i] < otherTargetNames[i]) {
                    return -1;
                }
                if (thisTargetNames[i] > otherTargetNames[i]) {
                    return 1;
                }
            }
            for (var name in this._targetNames) {
                var thisTargetBool = this._targetNames[name];
                var otherTargetBool = ss._targetNames[name];
                if (thisTargetBool < otherTargetBool) {
                    return -1;
                }
                if (thisTargetBool > otherTargetBool) {
                    return 1;
                }
            }
            return 0;
        }
    }),
    'osgAnimation',
    'MorphAttribute'
);

export default MorphAttribute;
