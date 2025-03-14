import notify from 'osg/notify';
import utils from 'osg/utils';
import Uniform from 'osg/Uniform';
import BlendFunc from 'osg/BlendFunc';
import Geometry from 'osg/Geometry';
import BufferArray from 'osg/BufferArray';
import primitiveSet from 'osg/primitiveSet';
import DrawArrays from 'osg/DrawArrays';
import DrawElements from 'osg/DrawElements';
import StateSet from 'osg/StateSet';
import Node from 'osg/Node';
import { mat4 } from 'osg/glMatrix';
import MatrixTransform from 'osg/MatrixTransform';
import Projection from 'osg/Projection';
import Registry from 'osgDB/Registry';

var ReaderParser = {};

ReaderParser.ObjectWrapper = {};
ReaderParser.ObjectWrapper.serializers = {};

ReaderParser.readImage = function(url, options) {
    return ReaderParser.registry().readImageURL(url, options);
};
ReaderParser.readImageURL = ReaderParser.readImage; // alias

ReaderParser.readBinaryArrayURL = function(url, options) {
    return ReaderParser.registry().readBinaryArrayURL(url, options);
};

ReaderParser.readNodeURL = function(url, options) {
    var extension = url.substr(url.lastIndexOf('.') + 1);
    var readerWriter = Registry.instance().getReaderWriterForExtension(extension);
    if (readerWriter !== undefined) return readerWriter.readNodeURL(url, options);
    // If we don't have a registered plugin go through the osgjs
    // FIXME: we should have osgjs also as a plugin in the future
    return ReaderParser.registry().readNodeURL(url, options);
};

ReaderParser.registry = function() {
    var Input = require('osgDB/Input').default;
    if (ReaderParser.registry._input === undefined) {
        ReaderParser.registry._input = new Input();
    }
    return ReaderParser.registry._input;
};

ReaderParser.parseSceneGraph = function(node, options) {
    if (node.Version !== undefined && node.Version > 0) {
        utils.time('osgjs.metric:ReaderParser.parseSceneGraph', notify.INFO);

        var key;
        for (var prop in node) {
            if (prop !== 'Generator' && prop !== 'Version') {
                key = prop;
                break;
            }
        }

        if (key) {
            var obj = {};
            obj[key] = node[key];
            var input = ReaderParser.registry().clone();
            input.setJSON(obj);

            // copy global options and override with user options
            var opt = utils.objectMix(
                utils.objectMix({}, ReaderParser.registry().getOptions()),
                options || {}
            );
            input.setOptions(opt);
            var object = input.readObject();
            utils.timeEnd('osgjs.metric:ReaderParser.parseSceneGraph', notify.INFO);
            return object;
        } else {
            notify.log("can't parse scenegraph " + node, notify.INFO);
        }
    } else {
        utils.time('osgjs.metric:ReaderParser.parseSceneGraphDeprecated', notify.INFO);
        var nodeOld = ReaderParser.parseSceneGraphDeprecated(node);
        utils.timeEnd('osgjs.metric:ReaderParser.parseSceneGraphDeprecated', notify.INFO);
        return nodeOld;
    }
    return undefined;
};

ReaderParser.parseSceneGraphDeprecated = function(node) {
    var getFieldBackwardCompatible = function(field, json) {
        var value = json[field];
        if (value === undefined) {
            value = json[field.toLowerCase()];
        }
        return value;
    };
    var setName = function(osgjs, json) {
        var name = getFieldBackwardCompatible('Name', json);
        if (name && osgjs.setName !== undefined) {
            osgjs.setName(name);
        }
    };

    var setMaterial = function(osgjs, json) {
        setName(osgjs, json);
        osgjs.setAmbient(getFieldBackwardCompatible('Ambient', json));
        osgjs.setDiffuse(getFieldBackwardCompatible('Diffuse', json));
        osgjs.setEmission(getFieldBackwardCompatible('Emission', json));
        osgjs.setSpecular(getFieldBackwardCompatible('Specular', json));
        osgjs.setShininess(getFieldBackwardCompatible('Shininess', json));
    };

    var setBlendFunc = function(osgjs, json) {
        setName(osgjs, json);
        osgjs.setSourceRGB(json.SourceRGB);
        osgjs.setSourceAlpha(json.SourceAlpha);
        osgjs.setDestinationRGB(json.DestinationRGB);
        osgjs.setDestinationAlpha(json.DestinationAlpha);
    };

    var setTexture = function(osgjs, json) {
        var magFilter = json.MagFilter || json['mag_filter'] || undefined;
        if (magFilter) {
            osgjs.setMagFilter(magFilter);
        }
        var minFilter = json.MinFilter || json['min_filter'] || undefined;
        if (minFilter) {
            osgjs.setMinFilter(minFilter);
        }
        var wrapT = json.WrapT || json['wrap_t'] || undefined;
        if (wrapT) {
            osgjs.setWrapT(wrapT);
        }
        var wrapS = json.WrapS || json['wrap_s'] || undefined;
        if (wrapS) {
            osgjs.setWrapS(wrapS);
        }
        var maxAnisotropy = json.MaxAnisotropy || json['max_anisotropy'] || undefined;
        if (maxAnisotropy) {
            osgjs.setMaxAnisotropy(maxAnisotropy);
        }
        var file = getFieldBackwardCompatible('File', json);
        ReaderParser.readImage(file)
            .then(function(img) {
                osgjs.setImage(img);
            })
            .catch(function() {
                notify.log("Can't read image");
            });
    };

    var setStateSet = function(osgjs, json) {
        setName(osgjs, json);
        var textures =
            getFieldBackwardCompatible('Textures', json) ||
            getFieldBackwardCompatible('TextureAttributeList', json) ||
            undefined;
        if (textures) {
            for (var t = 0, tl = textures.length; t < tl; t++) {
                var file = getFieldBackwardCompatible('File', textures[t]);
                if (!file) {
                    notify.log('no texture on unit ' + t + ' skip it');
                    continue;
                }
                var Texture = require('osg/Texture').default;
                var tex = new Texture();
                setTexture(tex, textures[t]);

                osgjs.setTextureAttributeAndModes(t, tex);
                osgjs.addUniform(Uniform.createInt1(t, 'Texture' + t));
            }
        }

        var blendfunc = getFieldBackwardCompatible('BlendFunc', json);
        if (blendfunc) {
            var newblendfunc = new BlendFunc();
            setBlendFunc(newblendfunc, blendfunc);
            osgjs.setAttributeAndModes(newblendfunc);
        }

        var material = getFieldBackwardCompatible('Material', json);
        if (material) {
            var Material = require('osg/Material').default;
            var newmaterial = new Material();
            setMaterial(newmaterial, material);
            osgjs.setAttributeAndModes(newmaterial);
        }
    };

    var newnode;
    var children = node.children;
    var primitives = node._primitives || node.primitives || node.Primitives || undefined;
    var attributes = node._attributes || node.attributes || node.Attributes || undefined;
    if (primitives || attributes) {
        var geom = new Geometry();
        setName(geom, node);
        geom.stateset = node.stateset;
        node = geom;

        for (var p = 0, lp = primitives.length; p < lp; p++) {
            var mode = primitives[p]._mode || primitives[p].mode;
            var array = primitives[p]._indices || primitives[p].indices;
            if (array) {
                array = new BufferArray(BufferArray[array.type], array.elements, array.itemSize);
                if (!mode) {
                    mode = 'TRIANGLES';
                } else {
                    mode = primitiveSet[mode];
                }
                geom.getPrimitiveSetList().push(new DrawElements(mode, array));
            } else {
                mode = primitiveSet[mode];
                var first = primitives[p].first || primitives[p]._first;
                var count = primitives[p].count || primitives[p]._count;

                geom.getPrimitiveSetList().push(new DrawArrays(mode, first, count));
            }
        }

        for (var attr in attributes) {
            var attributeArray = attributes[attr];
            geom.getVertexAttributeList()[attr] = new BufferArray(
                attributeArray.type,
                attributeArray.elements,
                attributeArray.itemSize
            );
        }
    }

    var stateset = getFieldBackwardCompatible('StateSet', node);
    if (stateset) {
        var newstateset = new StateSet();
        setStateSet(newstateset, stateset);
        node.stateset = newstateset;
    }

    var matrix = node.matrix || node.Matrix || undefined;
    if (matrix) {
        newnode = new MatrixTransform();
        setName(newnode, node);

        utils.extend(newnode, node);
        mat4.copy(newnode.getMatrix(), matrix);
        node = newnode;
    }

    var projection = node.projection || node.Projection || undefined;
    if (projection) {
        newnode = new Projection();
        setName(newnode, node);
        utils.extend(newnode, node);
        mat4.copy(newnode.setProjectionMatrix(), projection);
        node = newnode;
    }

    // default type
    if (node.typeID === undefined) {
        newnode = new Node();
        setName(newnode, node);
        utils.extend(newnode, node);
        node = newnode;
    }

    if (children) {
        // disable children, it will be processed in the end
        node.children = [];

        for (var child = 0, childLength = children.length; child < childLength; child++) {
            node.addChild(ReaderParser.parseSceneGraphDeprecated(children[child]));
        }
    }

    return node;
};

export default ReaderParser;
