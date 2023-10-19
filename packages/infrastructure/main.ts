import { Construct } from "constructs";
import { App, Chart, ChartProps } from "cdk8s";
import { Rollout } from "./imports/argoproj.io";
import { KubeNamespace, KubeService } from "./imports/k8s";


const environment = process.env.ARGOCD_ENV_ENVIRONMENT ?? "dev";


export class MyChart extends Chart {
  constructor(
    scope: Construct,
    id: string,
    props: ChartProps
  ) {
    super(scope, id, props);

    new KubeNamespace(this, "namespace", {
      metadata: { name: `node-api-${environment}` },
    });

    new Rollout(this, "deployment", {
      metadata: {
        name: "node-api",
      },
      spec: {
        replicas: 1,
        strategy: {
          blueGreen: {
            activeService: "node-api-active",
            previewService: "node-api-preview",
            autoPromotionEnabled: false,
          },
        },
        selector: {
          matchLabels: {
            app: "node-api",
          },
        },
        template: {
          metadata: {
            labels: {
              app: "node-api",
            },
          },
          spec: {
            nodeSelector: {
              nodetype: "worker",
            },
            containers: [
              {
                name: "node-api",
                image: "gkaskonas/node-api:v2",
                ports: [{ containerPort: 3000 }],
                resources: {
                  requests: {
                    cpu: "100m",
                  },
                },
              },
            ],
          },
        },
      },
    });

    new KubeService(this, "active-service", {
      metadata: {
        name: "node-api-active",
        labels: {
          app: "node-api",
        },
      },
      spec: {
        selector: {
          app: "node-api",
        },
        ports: [
          {
            port: 3000,
          },
        ],
      },
    });

    new KubeService(this, "preview-service", {
      metadata: {
        name: "node-api-preview",
        labels: {
          app: "node-api",
        },
      },
      spec: {
        selector: {
          app: "node-api",
        },
        ports: [
          {
            port: 3000,
          },
        ],
      },
    });
  }
}

const app = new App();
new MyChart(app, "infrastructure", {
   namespace: `node-api-${environment}`,
});
app.synth();
