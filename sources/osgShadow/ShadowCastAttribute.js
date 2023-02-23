import utils from 'osg/utils';
import StateAttribute from 'osg/StateAttribute';

// Used to notify the Compiler to create a Depth Casting optimized shader
var ShadowCastAttribute = function(disable, shadowReceiveAttribute) {
    StateAttribute.call(this);
    this._enable = !disable;
    this._shadowReceiveAttribute = shadowReceiveAttribute;
    this._dirtyHash = true;
    this._hash = '';
};

utils.createPrototypeStateAttribute(
    ShadowCastAttribute,
    utils.objectInherit(StateAttribute.prototype, {
        attributeType: 'ShadowCast',
        cloneType: function() {
            return new ShadowCastAttribute(true);
        },
        setReceiveAttribute: function(shadowReceiveAttribute) {
            this._shadowReceiveAttribute = shadowReceiveAttribute;
        },
        getReceiveAttribute: function() {
            return this._shadowReceiveAttribute;
        },
        getDefines: function() {
            return this._shadowReceiveAttribute.getDefines();
        },
        _computeInternalHash: function() {
            return 'ShadowCast' + this._enable + this._shadowReceiveAttribute.getPrecision();
        },
        getHash: function() {
            var receiveAttributeDirty = false;
            if (this._shadowReceiveAttribute && this._shadowReceiveAttribute._dirtyHash)
                this._receiveAttributeDirty = true;

            if (!this._dirtyHash && !receiveAttributeDirty) return this._hash;

            this._hash = this._computeInternalHash();
            this._dirtyHash = false;
            return this._hash;
        },
        // need a isEnabled to let the ShaderGenerator to filter
        // StateAttribute from the shader compilation
        isEnabled: function() {
            return this._enable;
        },
        
        compare: function(attr) {
            var compareTypes = StateAttribute.prototype.compare.call(this, attr);
            if (compareTypes !== 0) {
                return compareTypes;
            }
            if (this._enable < attr._enable) {
                return -1;
            }
            if (this._enable > attr._enable) {
                return 1;
            }
            if (!this._shadowReceiveAttribute && attr._shadowReceiveAttribute) {
                return -1;
            }
            if (this._shadowReceiveAttribute && !attr._shadowReceiveAttribute) {
                return 1;
            }
            if (this._shadowReceiveAttribute && attr._shadowReceiveAttribute) {
                return this._shadowReceiveAttribute.compare(attr._shadowReceiveAttribute);
            }
            return 0;
        }
    }),
    'osgShadow',
    'ShadowCastAttribute'
);

export default ShadowCastAttribute;
