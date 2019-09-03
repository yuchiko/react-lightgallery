import React, { Component, createRef } from "react";
import { createPortal } from "react-dom";
import PT from "prop-types";
import debounce from "lodash/debounce";
import { isBrowser } from "browser-or-node";
//
import lightgalleryContext from "./lightgalleryContext";
import { addPrefix } from "./utils";

if (isBrowser) {
    import("lightgallery.js").then(() => {
        console.info("lightgallery.js is loaded");
        import("lg-fullscreen.js").then(() => {
            // console.info("lg-fullscreen.js is loaded");
        });
        import("lg-zoom.js").then(() => {
            // console.info("lg-zoom.js is loaded");
        });
        import("lg-thumbnail.js").then(() => {
            // console.info("lg-thumbnail.js is loaded");
        });
        import("lg-video.js").then(() => {
            // console.info("lg-video.js is loaded");
        });
    });
}

export class LightgalleryProvider extends Component {
    static propTypes = {
        children: PT.any,
        // https://sachinchoolur.github.io/lightgallery.js/docs/api.html#lightgallery-core
        lightgallerySettings: PT.object,
        galleryClassName: PT.string,
        portalElementSelector: PT.string
    };

    groups = {};
    gallery_element = createRef();

    componentWillUnmount() {
        this.destroyExistGallery();
    }

    _forceUpdate = debounce(this.forceUpdate, 50);

    getLgUid = () => {
        if (this.gallery_element.current)
            return this.gallery_element.current.getAttribute("lg-uid");
    };

    registerPhoto = (item_id, group_name, options) => {
        this.groups = {
            ...this.groups,
            [group_name]: [
                ...(this.groups[group_name] || []),
                { ...options, id: item_id }
            ]
        };
        this._forceUpdate();
    };

    unregisterPhoto = (item_id, group_name) => {
        this.groups = {
            ...this.groups,
            [group_name]: this.groups[group_name].filter(
                opts => opts.id !== item_id
            )
        };
        this._forceUpdate();
    };

    destroyExistGallery = () => {
        if (
            typeof window === "object" &&
            window.lgData &&
            window.lgData[this.getLgUid()]
        ) {
            window.lgData[this.getLgUid()].destroy(true);
        }
    };

    openGallery = (item_id, group_name) => {
        if (!this.gallery_element.current) {
            console.error(
                "Error on trying to open gallery; ref 'gallery_element' is not defined"
            );
            return;
        }
        if (!this.groups.hasOwnProperty(group_name)) {
            console.error("Trying to open undefined group");
            return;
        }
        this.destroyExistGallery();
        // open new gallery
        const current_group = this.groups[group_name];
        lightGallery(this.gallery_element.current, {
            ...(this.props.lightgallerySettings || {}),
            dynamic: true,
            dynamicEl: current_group,
            index: current_group.findIndex(i => i.id === item_id)
        });
    };

    render() {
        const {
            galleryClassName = addPrefix("gallery"),
            portalElementSelector
        } = this.props;
        let portalTarget = null;
        if (isBrowser) {
            // TODO log about error
            portalTarget = portalElementSelector
                ? document.querySelector(portalElementSelector)
                : document.body;
        }
        return (
            <lightgalleryContext.Provider
                value={{
                    registerPhoto: this.registerPhoto,
                    unregisterPhoto: this.unregisterPhoto,
                    openGallery: this.openGallery
                }}
            >
                {this.props.children}
                {isBrowser &&
                    createPortal(
                        <div
                            className={galleryClassName}
                            ref={this.gallery_element}
                        />,
                        portalTarget
                    )}
            </lightgalleryContext.Provider>
        );
    }
}