// ==UserScript==
// @name TwitterFeature
// @description Feature for twitter.com
// @author Dapplets Team
// @version 1
// @familyId TwitterFeature
// @adapterId TwitterAdapter-v1
// @icon data:image/png;base64,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
// ==/UserScript==
var METAMASK_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAATCAYAAAByUDbMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAjhJREFUeNrUVM9rE1EQ/t7Lbn6UqAlFscYNYrfVKoXSi0ehLcSDknjwpFC8i5fiMbUHqQriPyD17B+QoqDQg1QoKB5Ec9GaNP4IVtq6bXa72d23zm6aEDcm4K0ODDv7DfPtNzPvLfDf2dyFdIJ87F9q2N/AfEZJhhhbojBFPjT3bG2rPf/ttnrcBSZfV2w1+7iUb+JSkOjWRGqAM7ZCoeK998lYqd45+caLhcMO2DYGiWjkVcnBu6q4317bQRaV+RW2R+SZbmG4vIHh0WMclg1sWMDToo3vmoAtxKP2Wh4ko/ZmgtjyqgOX5EghoPDB8onI3s4///KpK9lsRjlLj3Q7FiaCqSHJV8VI8gTFHkbkavCjf5DRrL6SgPetGVD24hkZ/X0Mu1YDGzjEfCwi4VdPMm9rR+KsqCQZ0kmOSVLhEXnmOLQA0WjVw66NhxeCZB0LmD4nJ/jegTF2gZrhtnJmHYhFGW3VhSsgeirTH6gniGiq+R6L0sxkoLITxnwxjfWdkI//MGW4nEs9lZGGm8FTfDDOMBqz8FCpwKZWTZrdqcM26pbbWxnN5bpX0HSdWlz/6WBzS0DTG5g3M4doohGWpU4SXcm0Gl5uU1HTDZqRadLZk7m/AINizZCgx1V8rKfGbhTsJc5Y1zYXKHXJvzouqoyxRSmZfFE7ncvYR8dzkiy3lKytlmH2L2rCLXW/6OX84F3dEoWRe5+XO25C4cnlSDic4yGe1nVj2xFi+nz26ub+/wf+FmAAmiLTFxlZBnAAAAAASUVORK5CYII=';
var ETHEREUM_ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAgCAYAAADwvkPPAAAACXBIWXMAAAsTAAALEwEAmpwYAAADn0lEQVRIiaWWTWxUVRTHf+e+GabfIrXFmGhNIJhIUIhdWKsGEjFRE+JmKEVropIWOqVS2krRAGM0xlBmEGypNSHxI+l0SoILidWdLsREAkSQpPUrcWEwtoSkbVqmM+8eF7STmelMp9Szevd//vd3T/LuO+fBEqKut/PZxv5Gbz6fyWdo6OuoFOzgZLws8L9hcUsIuFtF3/H3dt67bNj2Ux3PgL48tyxz1H6wmF9yJfzhtkLHZ64Aa9MzWjsYCJ+/o8qcAvPWQhCA9PiH/M6SYf6P2x9GOZDjnE2esft3LQkWDAaN49IP5LwKqvL+Kz0Hy/PCRu+ZfA14MhcIAGHVrMy+t1BOifoP31htvZ4RgZWLwuYLVFMdbem+lL0yrye0RBCAiNieYDCYZCQf6nvatyq8lLUEuArMZEnVjFZONqTB/OG2QjX0ZRgTqA6g8ng0EHpEPDwAehhkLO0g5ai//8BdSZjH57yNsmau+jGQd7FOVUFx2etg1+/obf/JxjmMsV+4MbcKpFFgdI5Xadx4EEDqe9rWq5jLoFcVTky48Wi5z1mVSHj2ALtBK1IKcVGNGnG6140VXxmtmHoBtEOhVo1sNFacLaCbB5vD1ajzy0rH90ki4fwFeigDBOAgstNiL49UTAyr2ulIc2izMfYJXPuU+If8jvNv1TYR3afwdLYXkCcuisrR6+MlZ50NW547JNAHPLgMEMB9CP6Sotm4sWJPq5pqkO+XCbuoojUer3vaeF15VIzucgtjflV5EfhtiZAbCE1GprcalR1x19loBlrCX6N6y8ys+FWgylsqmxT2ATdzQCxKb6zk1kNqZcJq0TWLFESbQ8MGwK0o7RLkd0RPxCe54FhGXJ9dCxwHEkmM6A8G85hrnI98UwVREY0AUyumaYeUD73uZOcacewloOz2Rs4ZY/YDqGuPIPrNjRLzZfkkBxV9k9stylWoiQZCFwCSHfPa8PmbG56v/RPBPyetU9XdqiRcj6cL164umuUcsC25TzkSbQkNzjPSukak5diQIv0pkhe0w0kk/haRr0i/Pj/+M16aNmAWNEcbc9vmukRqFGesp9Q1Dd8Fg4lUcQHszP7jM8ayHXQ6MzcfKtIabe3+I1PPOlAie0MjItKcg3U2uufYp9kSOUddpDn0mSCfZ8jXxUMTgt4RDCDBdCClb2Esr0aaQuO5/IvCzgROTVlX64AY6MmBvaFvF/Pn/XGJtoZ/VpU6N6Zd+bz/AdGOYJE0REqSAAAAAElFTkSuQmCC';
var Feature = (function () {
    function Feature() {
    }
    Feature.prototype.getAugmentationConfig = function (_a, core) {
        var button = _a.button, menuItem = _a.menuItem;
        var _b = Feature.REQUIRES, overlay = _b.overlay, adapter = _b.adapter;
        return {
            TIMELINE: {
                TWEET_SOUTH: [
                    button({
                        class: 'dapplet-tweet-south-metamask',
                        img: METAMASK_ICON,
                        exec: function (ctx) {
                            alert(JSON.stringify(ctx));
                        }
                    }),
                    button({
                        class: 'dapplet-tweet-south-ethereum',
                        img: ETHEREUM_ICON,
                        exec: function (ctx) {
                            alert(JSON.stringify(ctx));
                        },
                        label: "RTN"
                    })
                ],
                TWEET_COMBO: [],
            },
            DIRECT_MESSAGE: {
                DM_SOUTH: [
                    button({
                        class: 'dapplet-dm-south-metamask',
                        img: METAMASK_ICON,
                        exec: function (ctx) {
                            alert(JSON.stringify(ctx));
                        }
                    })
                ],
            }
        };
    };
    Feature.REQUIRES = {
        adapter: "TwitterAdapter-v1",
        overlay: "0xOverlay"
    };
    return Feature;
}());
